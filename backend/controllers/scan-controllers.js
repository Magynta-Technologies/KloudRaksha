import {
  Scanrequests,
  ScanRequest,
  Results,
  User,
  AuditActionType,
} from "../models/schema.js";
import sendEmail, { sendScanCompletionEmail } from "./send-email.js";
import { asyncWrapper } from "../middleware/asyncWrapper.js";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import axios from "axios";
import { randomUUID } from "crypto";
import { logEvent } from "./log-controller.js";
import { format } from "date-fns";
import { S3Client, GetObjectCommand, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  buildMetadataFromFindings,
  normalizeFindings,
  shouldRefreshMetadata,
} from "../utils/findings-normalizer.js";

const fileExists = promisify(fs.exists);
const fsPromises = fs.promises;
const LOCAL_REPORTS_DIR =
  process.env.LOCAL_REPORTS_DIR ||
  path.join(process.cwd(), "..", "server", "prowler_outputs");
const AWS_S3_BUCKET = "kloudraksha-audit-reports";
const AWS_S3_PREFIX = (process.env.AWS_S3_PREFIX || "prowler-reports").replace(/\/+$/g, "").replace(/^\/+/, "");
const REQUIRE_S3_UPLOAD = true;

const preferredReportFile = (reportFiles = []) => {
  if (!reportFiles.length) return null;
  return (
    reportFiles.find(file => file.type === "json-ocsf") ||
    reportFiles.find(file => file.type === "json") ||
    reportFiles[0]
  );
};

const resolveLocalReportPath = async (auditId, reportFiles = []) => {
  if (!LOCAL_REPORTS_DIR) return null;

  const candidates = [];
  const preferred = preferredReportFile(reportFiles);

  const pushCandidate = (value) => {
    if (!value) return;
    const candidate = path.isAbsolute(value)
      ? value
      : path.join(LOCAL_REPORTS_DIR, value);
    candidates.push(candidate);
  };

  if (preferred) {
    pushCandidate(preferred.local_path);
    pushCandidate(preferred.key);
    pushCandidate(preferred.filename ? path.join(auditId, preferred.filename) : null);
  }

  // Known filename patterns
  pushCandidate(path.join(auditId, `${auditId}.ocsf.json`));
  pushCandidate(path.join(auditId, `${auditId}.json`));
  pushCandidate(path.join(auditId, `${auditId}.asff.json`));

  for (const candidate of candidates) {
    try {
      const stats = await fsPromises.stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch (_) {
      continue;
    }
  }
  return null;
};

const describeReportFileType = (filename = "") => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ocsf.json")) return "json-ocsf";
  if (lower.endsWith(".asff.json")) return "json-asff";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".csv")) return "csv";
  return path.extname(lower).replace(".", "") || "file";
};

const guessMimeType = (filename = "") => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
};

const sanitizeStorageKey = (key = "") => key.replace(/\\/g, "/").replace(/^\/+/, "");

const buildStorageKey = (auditId, filename) => {
  const parts = [];
  if (AWS_S3_PREFIX) parts.push(AWS_S3_PREFIX);
  if (auditId) parts.push(auditId);
  parts.push(filename);
  return sanitizeStorageKey(parts.filter(Boolean).join("/"));
};

const resolveLocalReportFilePath = async (auditId, fileMeta = {}) => {
  if (!LOCAL_REPORTS_DIR) return null;
  const candidates = [];
  if (fileMeta.local_path) candidates.push(fileMeta.local_path);
  if (fileMeta.key) candidates.push(path.join(LOCAL_REPORTS_DIR, fileMeta.key));
  if (fileMeta.filename)
    candidates.push(path.join(LOCAL_REPORTS_DIR, auditId || "", fileMeta.filename));
  if (fileMeta.key && auditId) {
    candidates.push(path.join(LOCAL_REPORTS_DIR, auditId, path.basename(fileMeta.key)));
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const stats = await fsPromises.stat(candidate);
      if (stats.isFile()) return candidate;
    } catch (_) {
      continue;
    }
  }
  return null;
};

const discoverLocalReportFiles = async (auditId) => {
  if (!LOCAL_REPORTS_DIR || !auditId) return [];
  const baseDir = path.join(LOCAL_REPORTS_DIR, auditId);
  try {
    const entries = await fsPromises.readdir(baseDir);
    const files = [];
    for (const entry of entries) {
      const filePath = path.join(baseDir, entry);
      try {
        const stats = await fsPromises.stat(filePath);
        if (!stats.isFile()) continue;
        files.push({
          filename: entry,
          key: sanitizeStorageKey(path.join(auditId, entry)),
          bucket: "local",
          region: null,
          mime_type: guessMimeType(entry),
          size: stats.size,
          type: describeReportFileType(entry),
          storage: "local",
          local_path: filePath,
        });
      } catch (_) {
        continue;
      }
    }
    return files;
  } catch (_) {
    return [];
  }
};

const uploadLocalFileToS3 = async (filePath, auditId) => {
  if (!s3Client || !AWS_S3_BUCKET) {
    if (REQUIRE_S3_UPLOAD) {
      const reason = !AWS_S3_BUCKET
        ? "AWS_S3_BUCKET is not configured"
        : "S3 client is not initialized";
      const error = new Error(
        `Report artifact upload blocked: ${reason}. Set AWS credentials/bucket or disable REQUIRE_S3_UPLOAD.`
      );
      error.code = "S3_UPLOAD_NOT_CONFIGURED";
      throw error;
    }
    return null;
  }

  await fsPromises.access(filePath, fs.constants.R_OK);
  const filename = path.basename(filePath);
  const key = buildStorageKey(auditId, filename);
  const body = fs.createReadStream(filePath);

  // Ensure bucket exists
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: AWS_S3_BUCKET }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: AWS_S3_BUCKET }));
      } catch (createErr) {
        console.error("Failed to create bucket", createErr);
        throw new Error(`Failed to create S3 bucket ${AWS_S3_BUCKET}: ${createErr.message}`);
      }
    } else {
      throw err;
    }
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: body,
      })
    );
  } catch (err) {
    err.message = `Failed to upload report artifact to s3://${AWS_S3_BUCKET}/${key}: ${err.message}`;
    err.code = err.code || "S3_UPLOAD_FAILED";
    throw err;
  }
  const stats = await fsPromises.stat(filePath);
  return {
    filename,
    key,
    bucket: AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    mime_type: guessMimeType(filename),
    size: stats.size,
    type: describeReportFileType(filename),
    storage: "s3",
  };
};

const ensureReportFilesForAudit = async (auditId, existingFiles = []) => {
  let files = Array.isArray(existingFiles) ? [...existingFiles] : [];
  let changed = false;

  if (!files.length) {
    const discovered = await discoverLocalReportFiles(auditId);
    if (discovered.length) {
      files = discovered;
      changed = true;
    }
  }

  if (!files.length) {
    return { files, changed };
  }

  const updatedFiles = [];
  let uploadedAny = false;

  for (const file of files) {
    if (file?.bucket && file.bucket !== "local") {
      updatedFiles.push(file);
      continue;
    }

    const localPath = await resolveLocalReportFilePath(auditId, file);
    if (!localPath) {
      updatedFiles.push(file);
      continue;
    }

    try {
      const uploadedMeta = await uploadLocalFileToS3(localPath, auditId);
      if (uploadedMeta) {
        updatedFiles.push({ ...file, ...uploadedMeta });
        uploadedAny = true;
      } else {
        updatedFiles.push({
          ...file,
          bucket: file.bucket || "local",
          storage: file.storage || "local",
          local_path: localPath,
        });
      }
    } catch (err) {
      console.error(
        `[report] Failed to upload report artifact for audit ${auditId}:`,
        err
      );
      if (REQUIRE_S3_UPLOAD) {
        const reason = err?.message || "Unknown error";
        const uploadErr = new Error(
          `Report upload aborted for audit ${auditId}: ${reason}`
        );
        uploadErr.code = err?.code || "S3_UPLOAD_FAILED";
        uploadErr.details = { auditId, reason };
        throw uploadErr;
      }
      updatedFiles.push({
        ...file,
        bucket: file.bucket || "local",
        storage: file.storage || "local",
        local_path: localPath,
      });
    }
  }

  const result = {
    files: updatedFiles,
    changed: changed || uploadedAny,
  };

  if (REQUIRE_S3_UPLOAD && !uploadedAny) {
    const err = new Error(
      `REQUIRE_S3_UPLOAD is enabled but no report artifacts could be uploaded for audit ${auditId}`
    );
    err.code = "S3_UPLOAD_MISSING";
    err.details = { auditId };
    throw err;
  }

  return result;
};


const hydrateResultsFromLocalReport = async (scanDoc) => {
  if (!scanDoc) return null;

  try {
    const reportPath = await resolveLocalReportPath(
      scanDoc.audit_id,
      scanDoc.report_files
    );

    if (!reportPath) {
      console.warn(
        `[hydrateResultsFromLocalReport] Local report not found for audit_id: ${scanDoc.audit_id}`
      );
      return null;
    }

    const rawContent = await fsPromises.readFile(reportPath, "utf-8");
    const parsed = JSON.parse(rawContent);
    const rawFindings = Array.isArray(parsed)
      ? parsed
      : parsed.findings || parsed.results || parsed.checks || [];

    const { normalized: normalizedFindings } = normalizeFindings(rawFindings);
    const {
      files: ensuredReportFiles,
      changed: reportFilesUpdated,
    } = await ensureReportFilesForAudit(
      scanDoc.audit_id,
      scanDoc.report_files || []
    );
    const metadata = buildMetadataFromFindings(
      normalizedFindings,
      scanDoc.metadata
    );

    const updatedResult = await Results.findOneAndUpdate(
      { audit_id: scanDoc.audit_id },
      {
        audit_id: scanDoc.audit_id,
        user_id: scanDoc.user_id,
        data: normalizedFindings,
        metadata,
        user_info: scanDoc.user_info || {},
        created_at: scanDoc.created_at || new Date(),
        report_files: ensuredReportFiles,
      },
      { new: true, upsert: true }
    ).lean();

    await Scanrequests.updateOne(
      { audit_id: scanDoc.audit_id },
      {
        $set: {
          metadata,
          report_files: ensuredReportFiles,
        },
      }
    );

    if (reportFilesUpdated) {
      console.info(
        `[hydrateResultsFromLocalReport] Uploaded local report artifacts for audit_id: ${scanDoc.audit_id}`
      );
    }

    console.info(
      `[hydrateResultsFromLocalReport] Hydrated results for audit_id: ${scanDoc.audit_id}`
    );
    return updatedResult;
  } catch (error) {
    console.error(
      `[hydrateResultsFromLocalReport] Failed to hydrate results for audit_id: ${scanDoc.audit_id}`,
      error
    );
    return null;
  }
};
const AUDIT_SERVICE_URL = (process.env.AUDIT_SERVICE_URL || "http://127.0.0.1:6000").replace(/\/$/, "");
const CALLBACK_BASE_URL = (process.env.INTERNAL_API_URL || process.env.API_URL || "http://backend:8000/api").replace(/\/$/, "");
const S3_SIGNED_URL_TTL = Number(process.env.S3_PRESIGNED_TTL || 300);

let s3Client = null;
try {
  s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: "",
      secretAccessKey: "",
    },
  });
} catch (err) {
  console.error("Failed to initialize S3 client", err);
}

const buildReportDownloadUrl = async (bucket, key) => {
  if (!s3Client) {
    throw new Error("S3 client is not configured");
  }
  if (!bucket || !key) {
    throw new Error("Report bucket or key is missing");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: S3_SIGNED_URL_TTL });
};

const syncScanWithResults = async (scanDoc) => {
  if (!scanDoc) return null;

  const needsMetadata = !scanDoc.metadata;
  const needsS3Info = !scanDoc.report_s3_bucket || !scanDoc.report_s3_key;
  const needsReportFiles = !scanDoc.report_files || scanDoc.report_files.length === 0;

  if (!needsMetadata && !needsS3Info && !needsReportFiles) {
    return scanDoc;
  }

  const resultDoc = await Results.findOne({ audit_id: scanDoc.audit_id }).lean();
  if (!resultDoc) {
    return scanDoc;
  }

  const updates = {};
  if (needsMetadata && resultDoc.metadata) {
    updates.metadata = resultDoc.metadata;
  }

  if (
    needsS3Info &&
    resultDoc.s3_report_bucket &&
    resultDoc.s3_report_key
  ) {
    updates.report_s3_bucket = resultDoc.s3_report_bucket;
    updates.report_s3_key = resultDoc.s3_report_key;
    updates.report_s3_region = resultDoc.s3_report_region || process.env.AWS_REGION;
  }

  if (needsReportFiles && resultDoc.report_files?.length) {
    updates.report_files = resultDoc.report_files;
  }

  if (!Object.keys(updates).length) {
    return scanDoc;
  }

  return await Scanrequests.findOneAndUpdate(
    { audit_id: scanDoc.audit_id },
    { $set: updates },
    { new: true }
  );
};

export const getScanResults = async (req, res) => {
  try {
    const audit_id = req.params.id;
    const isAdmin = req.path.includes("admin");

    const meta = await Scanrequests.findOne({ audit_id });
    if (!meta) {
      console.error(`[getScanResults] Audit metadata not found for audit_id: ${audit_id}`);
      return res.status(404).json({ error: "Audit metadata not found" });
    }

    // Only block access for scans that are still running
    const isScanProcessing =
      meta.status === "pending" || (meta.status === "reviewing" && !isAdmin);

    if (isScanProcessing) {
      return res.status(202).json({
        message: "Scan is still in progress",
        status: meta.status,
        findings: [],
        metadata: meta.metadata || {},
        reportFiles: meta.report_files || [],
        s3Report: null,
        uploadErrors: [],
      });
    }

    let resultDoc = await Results.findOne({ audit_id });

    if (!resultDoc) {
      resultDoc = await hydrateResultsFromLocalReport(meta);
    }

    // If no resultDoc but scan is completed, return metadata from scanrequests
    if (!resultDoc) {
      console.warn(`[getScanResults] Results document not found for audit_id: ${audit_id}, but metadata exists`);
      // Return what we have from metadata
      const {
        files: ensuredReportFiles,
        changed: reportFilesPatched,
      } = await ensureReportFilesForAudit(audit_id, meta.report_files || []);

      if (reportFilesPatched) {
        try {
          await Scanrequests.updateOne(
            { audit_id },
            { $set: { report_files: ensuredReportFiles } }
          );
          meta.report_files = ensuredReportFiles;
        } catch (err) {
          console.error(
            `[getScanResults] Failed to persist reconstructed report files for audit_id: ${audit_id}`,
            err
          );
        }
      }

      return res.status(200).json({
        findings: [],
        metadata: meta.metadata || {},
        reportFiles: meta.report_files || ensuredReportFiles || [],
        s3Report: meta.report_s3_key
          ? {
              bucket: meta.report_s3_bucket,
              key: meta.report_s3_key,
              region: meta.report_s3_region,
            }
          : null,
        uploadErrors: meta.upload_errors || [],
        message: "Results are being processed. Findings will be available shortly.",
      });
    }

    // Check if data exists (even if empty array)
    let findings = Array.isArray(resultDoc.data) ? resultDoc.data : [];

    // If data field doesn't exist or is not an array, check if it's being processed
    if (!Array.isArray(resultDoc.data) && resultDoc.data !== undefined) {
      console.warn(`[getScanResults] Results data is not an array for audit_id: ${audit_id}`);
      findings = [];
    }

    let metadata = resultDoc.metadata || meta.metadata || {};
    const { normalized: normalizedFindings, changed: findingsChanged } = normalizeFindings(findings);
    findings = normalizedFindings;

    const metadataNeedsRefresh =
      findingsChanged || shouldRefreshMetadata(findings, metadata);

    if (metadataNeedsRefresh) {
      metadata = buildMetadataFromFindings(findings, metadata);
    }

    let reportFiles = resultDoc.report_files?.length
      ? resultDoc.report_files
      : meta.report_files || [];
    const uploadErrors = (resultDoc.upload_errors?.length
      ? resultDoc.upload_errors
      : meta.upload_errors) || [];

    const {
      files: ensuredReportFiles,
      changed: reportFilesChanged,
    } = await ensureReportFilesForAudit(audit_id, reportFiles);
    reportFiles = ensuredReportFiles;

    if (findingsChanged || metadataNeedsRefresh || reportFilesChanged) {
      const updatePayload = {};
      if (findingsChanged) {
        updatePayload.data = findings;
      }
      if (metadataNeedsRefresh) {
        updatePayload.metadata = metadata;
      }
      if (reportFilesChanged) {
        updatePayload.report_files = reportFiles;
      }

      if (Object.keys(updatePayload).length) {
        try {
          await Results.updateOne({ audit_id }, { $set: updatePayload });
        } catch (updateErr) {
          console.error(
            `[getScanResults] Failed to persist normalized findings for audit_id: ${audit_id}`,
            updateErr
          );
        }
      }

      if (metadataNeedsRefresh || reportFilesChanged) {
        const scanUpdatePayload = {};
        if (metadataNeedsRefresh) {
          scanUpdatePayload.metadata = metadata;
        }
        if (reportFilesChanged) {
          scanUpdatePayload.report_files = reportFiles;
          meta.report_files = reportFiles;
        }
        try {
          await Scanrequests.updateOne(
            { audit_id },
            { $set: scanUpdatePayload }
          );
          if (metadataNeedsRefresh) {
            meta.metadata = metadata;
          }
        } catch (metaErr) {
          console.error(
            `[getScanResults] Failed to update scan metadata for audit_id: ${audit_id}`,
            metaErr
          );
        }
      }
    }

    if (!isAdmin) {
      const removed = meta.removed_items || [];
      const clusterings = meta.clustering || [];
      findings = findings.filter(
        item =>
          !removed.includes(item.Id) &&
          !clusterings.some(c => c.clusteredIds.includes(item.Id))
      );
    }

    const responsePayload = {
      findings,
      metadata: metadata || {},
      reportFiles,
      s3Report: resultDoc.s3_report_key || meta.report_s3_key
        ? {
            bucket: resultDoc.s3_report_bucket || meta.report_s3_bucket,
            key: resultDoc.s3_report_key || meta.report_s3_key,
            region: resultDoc.s3_report_region || meta.report_s3_region,
            storage: resultDoc.report_storage || meta.report_storage || 
              (resultDoc.s3_report_bucket || meta.report_s3_bucket ? "s3" : "local"),
          }
        : null,
      uploadErrors,
    };

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("[getScanResults] Error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
};

export const getAlladminScanRequests = async (req, res) => {
  try {
    let requests = await Scanrequests.find().lean();

    // Only sync metadata/reports for completed scans that are missing data
    const missingAuditIds = requests
      .filter(scan => 
        scan.status === "completed" && 
        (!scan.metadata || !scan.report_s3_bucket || !scan.report_s3_key || !(scan.report_files?.length))
      )
      .map(scan => scan.audit_id);

    if (missingAuditIds.length) {
      const missingAuditSet = new Set(missingAuditIds);
      const resultsDocs = await Results.find({ audit_id: { $in: missingAuditIds } })
        .select("audit_id metadata s3_report_bucket s3_report_key s3_report_region report_files upload_errors")
        .lean();
      const resultsMap = new Map(resultsDocs.map(doc => [doc.audit_id, doc]));

      requests = requests.map(scan => {
        if (!missingAuditSet.has(scan.audit_id)) return scan;
        const resultDoc = resultsMap.get(scan.audit_id);
        if (!resultDoc) return scan;

        const merged = { ...scan };
        if (!merged.metadata && resultDoc.metadata) {
          merged.metadata = resultDoc.metadata;
        }
        if (
          (!merged.report_s3_bucket || !merged.report_s3_key) &&
          resultDoc.s3_report_bucket &&
          resultDoc.s3_report_key
        ) {
          merged.report_s3_bucket = resultDoc.s3_report_bucket;
          merged.report_s3_key = resultDoc.s3_report_key;
          merged.report_s3_region = resultDoc.s3_report_region || process.env.AWS_REGION;
        }
        if ((!merged.report_files || !merged.report_files.length) && resultDoc.report_files?.length) {
          merged.report_files = resultDoc.report_files;
        }
        if ((!merged.upload_errors || !merged.upload_errors.length) && resultDoc.upload_errors?.length) {
          merged.upload_errors = resultDoc.upload_errors;
        }
        return merged;
      });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

export const getUserScanRequests = async (req, res) => {
  try {
    const userId = res.locals.jwtData.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const scanRequests = await Scanrequests.find(
      { user_id: userId },
      {
        user_info: 1,
        audit_id: 1,
        status: 1,
        is_verified: 1,
        createdAt: 1,
        created_at: 1,
        metadata: 1,
        provider: 1,
        pdf_urls: 1,
        purpose: 1,
        email: 1,
        report_s3_bucket: 1,
        report_s3_key: 1,
        report_s3_region: 1,
        report_files: 1,
      }
    );
    return res.status(200).json({ scanRequests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const scanRequest = async (req, res) => {
  try {
    const { name, email, purpose, officeEmail, officePassword } = req.body;
    const userId = res.locals.jwtData.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const scanRequest = new ScanRequest({
      name,
      email,
      purpose,
      officeEmail,
      officePassword,
      user,
    });
    await scanRequest.save();

    await sendEmail(name, email, purpose, officeEmail, officePassword);

    return res.status(200).json({
      message: "Scan request initiated successfully!",
      scanRequest,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const scanRequestAutomate = async (req, res) => {
  try {
    const {
      name,
      email,
      purpose,
      officeEmail,
      provider,
      awsSecretKey,
      awsSecretPassword,
      azureClientId,
      azureClientSecret,
      azureTenantId,
      gcpClientId,
      gcpClientSecret,
      gcpTenantId,
    } = req.body;

    console.log("Received scan request with credentials:", {
      provider,
      awsSecretKey: awsSecretKey ? awsSecretKey.substring(0, 4) + "***" : undefined,
      awsSecretPassword: awsSecretPassword ? awsSecretPassword.substring(0, 4) + "***" : undefined,
    });

    const userId = res.locals.jwtData.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const auditId = randomUUID();
    const requestBody = {
      user_id: userId,
      audit_id: auditId,
      callback_url: `${CALLBACK_BASE_URL}/scan/scanRequestComplete`,
      name,
      email,
      purpose,
      office_email: officeEmail,
      provider,
    };

    if (provider === "aws") {
      requestBody.aws_access_key = awsSecretKey;
      requestBody.aws_secret_key = awsSecretPassword;
    } else if (provider === "azure") {
      requestBody.azure_client_id = azureClientId;
      requestBody.azure_client_secret = azureClientSecret;
      requestBody.azure_tenant_id = azureTenantId;
    } else if (provider === "gcp") {
      requestBody.gcp_client_id = gcpClientId;
      requestBody.gcp_client_secret = gcpClientSecret;
      requestBody.gcp_tenant_id = gcpTenantId;
    }
    const auditServiceEndpoint = `${AUDIT_SERVICE_URL}/run-audit`;
    console.log("Sending to audit service:", {
      url: auditServiceEndpoint,
      aws_access_key: requestBody.aws_access_key ? requestBody.aws_access_key.substring(0, 4) + "***" : undefined,
      aws_secret_key: requestBody.aws_secret_key ? requestBody.aws_secret_key.substring(0, 4) + "***" : undefined,
    });
    await axios.post(auditServiceEndpoint, requestBody);
    const scanRequest = new Scanrequests({
      user_id: userId,
      audit_id: auditId,
      user_info: {
        name,
        email,
        purpose,
        officeEmail,
        provider,
      },
      status: "pending",
      provider,
      credentials: {
        aws: provider === "aws" ? {
          awsSecretKey,
          awsSecretPassword,
        } : undefined,
        azure: provider === "azure" ? {
          clientId: azureClientId,
          clientSecret: azureClientSecret,
          tenantId: azureTenantId,
        } : undefined,
        gcp: provider === "gcp" ? {
          clientId: gcpClientId,
          clientSecret: gcpClientSecret,
          tenantId: gcpTenantId,
        } : undefined,
      },
    });
    await scanRequest.save();
    await logEvent(userId, AuditActionType.SCAN_INITIATED, "Passed", {
      audit_id: auditId,
      action: "Initiated",
    });

    return res.status(200).json({
      message: "Scan request initiated successfully!",
      auditId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const scanRequestComplete = async (req, res) => {
  try {
    if (!req.body.user_id) {
      return res.status(400).json({ message: "Missing required field: user_id" });
    }
    const status = req.body.status || "completed";

    let updatedScan = await Scanrequests.findOneAndUpdate(
      { audit_id: req.body.audit_id },
      {
        status,
        ...(req.body.error && { error: req.body.error }),
        ...(req.body.report_s3_key && { report_s3_key: req.body.report_s3_key }),
        ...(req.body.report_s3_bucket && { report_s3_bucket: req.body.report_s3_bucket }),
        ...(req.body.report_s3_region && { report_s3_region: req.body.report_s3_region }),
        ...(Array.isArray(req.body.upload_errors)
          ? { upload_errors: req.body.upload_errors }
          : {}),
      },
      { new: true }
    );

    if (!updatedScan) {
      return res.status(404).json({ error: "Scan request not found" });
    }

    updatedScan = (await syncScanWithResults(updatedScan)) || updatedScan;

    await logEvent(
      req.body.user_id,
      AuditActionType.SCAN_COMPLETED,
      status === "failed" ? "Failed" : "Passed",
      { audit_id: req.body.audit_id, action: "Completed" }
    );

    if (status === "completed") {
      const recipients = [
        updatedScan.user_info?.email,
        updatedScan.user_info?.officeEmail,
      ].filter(Boolean);

      if (recipients.length) {
        try {
          let downloadUrl = null;
          const preferredReportFile = updatedScan.report_files?.find(file => file.type === "json-ocsf")
            || updatedScan.report_files?.find(file => file.type === "json")
            || updatedScan.report_files?.[0];
          if (preferredReportFile?.bucket && preferredReportFile?.key) {
            try {
              downloadUrl = await buildReportDownloadUrl(
                preferredReportFile.bucket,
                preferredReportFile.key
              );
            } catch (err) {
              console.error("Failed to generate signed URL for completion email", err);
            }
          } else if (updatedScan.report_s3_bucket && updatedScan.report_s3_key) {
            try {
              downloadUrl = await buildReportDownloadUrl(
                updatedScan.report_s3_bucket,
                updatedScan.report_s3_key
              );
            } catch (err) {
              console.error("Failed to generate signed URL for completion email", err);
            }
          }

          await sendScanCompletionEmail({
            recipients,
            userName: updatedScan.user_info?.name,
            provider: updatedScan.provider,
            auditId: req.body.audit_id,
            metadata: updatedScan.metadata,
            downloadUrl,
            expiresIn: S3_SIGNED_URL_TTL,
          });
        } catch (error) {
          console.error("Failed to send scan completion notification", error);
        }
      }
    }

    return res.status(200).json({ message: "Scan request completion acknowledged" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, removed_items, clustering, is_verified } = req.body;

    const updatedRequest = await Scanrequests.findOneAndUpdate(
      { audit_id: id },
      {
        status,
        is_verified,
        removed_items: removed_items || undefined,
        clustering: clustering || undefined,
      }
    );

    await logEvent(
      updatedRequest.user_id,
      AuditActionType.SCAN_REVIEWED,
      "Passed",
      { audit_id: id, action: "Approved" }
    );

    res.status(200).send({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

export const downloadfile = asyncWrapper(async (req, res) => {
  try {
    const scanRequest = await ScanRequest.findById(req.params.id);
    if (!scanRequest || !scanRequest.file)
      return res.status(404).json({ message: "Scan request or file not found" });

    const filePath = path.resolve(scanRequest.file);
    const exists = await fileExists(filePath);
    if (!exists) return res.status(404).json({ message: "File not found on the server" });

    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error("Error sending file:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error sending file", error: err.message });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRequest = await Scanrequests.findOneAndDelete({ audit_id: id });
    if (!deletedRequest) return res.status(404).send("Request not found");
    res.status(200).send("Request deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting request");
  }
};

export const limitScanReq = async (req, res, next) => {
  try {
    const userId = res.locals.jwtData.id;
    const user = await User.findById(userId);

    if (!user || !user.subscription || !user.subscription.planId) {
      return res.status(400).json({ error: "Invalid user or subscription details" });
    }

    const planLimits = {
      plan_OKfOBjZs03DMuV: 1,
      plan_OKfOewHIlZ5WjW: 1,
      plan_OKfOzdYMTZffNP: 1,
      plan_OKfPFM8Omu1huB: 1,
    };

    const planLimit = planLimits[user.subscription.planId] || 1;

    const requestCount = await ScanRequest.countDocuments({
      user: user._id,
    });

    if (requestCount >= planLimit) {
      return res.status(429).json({ error: `You have reached your limit of ${planLimit} scan requests.` });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const populateMetadata = async (req, res) => {
  try {
    const userId = res.locals.jwtData.id;
    const scans = await Scanrequests.find({ user_id: userId });

    const updatePromises = scans.map(async (scan) => {
      const totalFindings = Math.floor(Math.random() * 100) + 50;
      const failedFindings = Math.floor(Math.random() * totalFindings);
      const passedFindings = totalFindings - failedFindings;

      const criticalFindings = Math.floor(Math.random() * failedFindings);
      const highFindings = Math.floor(Math.random() * (failedFindings - criticalFindings));
      const mediumFindings = Math.floor(
        Math.random() * (failedFindings - criticalFindings - highFindings)
      );
      const lowFindings = failedFindings - criticalFindings - highFindings - mediumFindings;

      const metadata = {
        aws_account_id: scan.metadata?.aws_account_id || "123456789012",
        total_findings: totalFindings,
        failed_findings: failedFindings,
        passed_findings: passedFindings,
        critical_findings: criticalFindings,
        high_findings: highFindings,
        medium_findings: mediumFindings,
        low_findings: lowFindings,
      };

      return Scanrequests.findByIdAndUpdate(scan._id, { $set: { metadata } }, { new: true });
    });

    await Promise.all(updatePromises);

    return res.status(200).json({
      message: `Successfully populated metadata for ${scans.length} scans`,
      scansUpdated: scans.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const getScanOverview = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: user not authenticated" });
    }

    // Fetch user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scans = await Scanrequests.find({ user_id: userId })
      .populate("user_info", "email name")
      .select("user_info audit_id status is_verified createdAt created_at metadata provider pdf_urls");

    if (!scans || scans.length === 0) {
      return res.status(200).json({
        donutData: { pass: 0, fail: 0 },
        severityData: { critical: 0, high: 0, medium: 0, low: 0 },
        trendData: [],
        scanUsage: { used: 0, remaining: 100, total: 100 },
      });
    }

    // Safe access to last scan
    const latestScan = scans[scans.length - 1];

    const donutData = {
      pass: latestScan.metadata?.passed_findings || 0,
      fail: latestScan.metadata?.failed_findings || 0,
    };

    const severityData = scans
      .filter(scan => scan.status === "completed")
      .reduce(
        (acc, scan) => ({
          critical: acc.critical + (scan.metadata?.critical_findings || 0),
          high: acc.high + (scan.metadata?.high_findings || 0),
          medium: acc.medium + (scan.metadata?.medium_findings || 0),
          low: acc.low + (scan.metadata?.low_findings || 0),
        }),
        { critical: 0, high: 0, medium: 0, low: 0 }
      );

    const trendData = scans
      .filter(scan => scan.status === "completed")
      .slice(-6)
      .map(scan => {
        let dateVal = scan.created_at || scan.createdAt || new Date();
        try {
          dateVal = format(new Date(dateVal), "MMM dd");
        } catch {
          dateVal = "Invalid Date";
        }
        return {
          date: dateVal,
          critical: scan.metadata?.critical_findings || 0,
          high: scan.metadata?.high_findings || 0,
          medium: scan.metadata?.medium_findings || 0,
          low: scan.metadata?.low_findings || 0,
        };
      });

    const planLimits = {
      plan_OKfOBjZs03DMuV: 100,
      plan_OKfOewHIlZ5WjW: 100,
      plan_OKfOzdYMTZffNP: 100,
      plan_OKfPFM8Omu1huB: 100,
    };

    const totalScans = planLimits[user.subscription?.planId] || 100;
    const usedScans = scans.length;

    const scanUsage = {
      used: usedScans,
      remaining: Math.max(totalScans - usedScans, 0),
      total: totalScans,
    };

    return res.status(200).json({
      donutData,
      severityData,
      trendData,
      scanUsage,
    });
  } catch (error) {
    console.error("[getScanOverview] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStatusandFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const filePath = path.join("uploads", req.file.filename);
    const updatedRequest = await ScanRequest.findByIdAndUpdate(
      id,
      { status, file: filePath },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Scan request not found" });
    }

    return res.status(200).json({
      message: "Status and file updated successfully",
      scanRequest: updatedRequest,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getRawReportLink = async (req, res) => {
  try {
    const auditId = req.params.id;
    const scanDoc = await Scanrequests.findOne({ audit_id: auditId });
    if (!scanDoc) {
      return res.status(404).json({ error: "Scan request not found" });
    }

    const requester = await User.findById(res.locals.jwtData.id);
    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }

    const isAdmin = ["admin", "superadmin"].includes(requester.role);
    const isOwner = scanDoc.user_id?.toString() === requester._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "You are not allowed to access this report" });
    }

    const availableFiles = (scanDoc.report_files || []).map(file =>
      typeof file.toObject === "function" ? file.toObject() : file
    );
    const requestedKey = req.query?.key;

    let targetFile = null;
    if (requestedKey) {
      targetFile = availableFiles.find(file => file.key === requestedKey);
    }

    if (!targetFile && availableFiles.length) {
      targetFile = availableFiles[0];
    }

    if (!targetFile && scanDoc.report_s3_bucket && scanDoc.report_s3_key) {
      targetFile = {
        bucket: scanDoc.report_s3_bucket,
        key: scanDoc.report_s3_key,
        region: scanDoc.report_s3_region || process.env.AWS_REGION,
        storage: "s3",
      };
    }

    if (!targetFile || !targetFile.key) {
      return res.status(404).json({ error: "Report is not available" });
    }

    // Check if file is stored locally
    const isLocalFile = targetFile.storage === "local" || targetFile.bucket === "local" || !targetFile.bucket;
    
    let primaryUrl;
    if (isLocalFile) {
      // Serve from local storage via audit service
      const auditServiceUrl = AUDIT_SERVICE_URL.replace(/\/$/, "");
      const filename = targetFile.local_path ? targetFile.local_path.split("/").pop() : targetFile.key.split("/").pop();
      primaryUrl = `${auditServiceUrl}/reports/${auditId}/${filename}`;
    } else {
      // Serve from S3
      if (!s3Client) {
        return res.status(503).json({ error: "S3 is not configured" });
      }
      try {
        primaryUrl = await buildReportDownloadUrl(targetFile.bucket, targetFile.key);
      } catch (err) {
        console.error("Failed to build signed URL", err);
        return res.status(500).json({ error: "Failed to generate download link" });
      }
    }

    const filesWithUrls = await Promise.all(
      availableFiles.map(async file => {
        if (!file.key) return null;
        
        const isLocal = file.storage === "local" || file.bucket === "local" || !file.bucket;
        
        if (isLocal) {
          const filename = file.local_path ? file.local_path.split("/").pop() : file.key.split("/").pop();
          const auditServiceUrl = AUDIT_SERVICE_URL.replace(/\/$/, "");
          return {
            ...file,
            url: `${auditServiceUrl}/reports/${auditId}/${filename}`,
            storage: "local",
          };
        } else {
          if (!file.bucket || !s3Client) return null;
          try {
            const signed = await buildReportDownloadUrl(file.bucket, file.key);
            return {
              ...file,
              url: signed,
              expiresIn: S3_SIGNED_URL_TTL,
              storage: "s3",
            };
          } catch (err) {
            console.error("Failed to sign report file", file.key, err);
            return {
              ...file,
              error: "Failed to sign",
            };
          }
        }
      })
    );

    return res.status(200).json({
      url: primaryUrl,
      expiresIn: isLocalFile ? null : S3_SIGNED_URL_TTL,
      bucket: targetFile.bucket,
      key: targetFile.key,
      region: targetFile.region || process.env.AWS_REGION,
      storage: isLocalFile ? "local" : "s3",
      files: filesWithUrls.filter(Boolean),
    });
  } catch (error) {
    console.error("Failed to build report link", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
