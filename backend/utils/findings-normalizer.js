import { randomUUID } from "crypto";

export const buildMetadataFromFindings = (findings = [], fallbackMetadata = {}) => {
  const counters = {
    total_findings: findings.length,
    failed_findings: 0,
    passed_findings: 0,
    critical_findings: 0,
    high_findings: 0,
    medium_findings: 0,
    low_findings: 0,
  };

  findings.forEach((finding) => {
    const severityLabel = (finding?.Severity?.Label || "").toLowerCase();
    switch (severityLabel) {
      case "critical":
        counters.critical_findings += 1;
        break;
      case "high":
        counters.high_findings += 1;
        break;
      case "medium":
        counters.medium_findings += 1;
        break;
      case "low":
        counters.low_findings += 1;
        break;
      default:
        break;
    }

    if (finding?.Compliance?.Status === "FAILED") {
      counters.failed_findings += 1;
    } else {
      counters.passed_findings += 1;
    }
  });

  return {
    aws_account_id:
      fallbackMetadata?.aws_account_id || findings[0]?.AwsAccountId || "unknown",
    ...counters,
  };
};

const parseDateSafe = (value) => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    const normalized = value < 1e12 ? value * 1000 : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  if (typeof value === "string" && value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
};

const normalizeComplianceStatus = (status) => {
  if (!status) return "PASSED";
  const normalized = status.toString().toUpperCase();
  if (normalized === "FAIL") return "FAILED";
  if (normalized === "WARN") return "WARNING";
  if (["FAILED", "PASSED", "WARNING"].includes(normalized)) {
    return normalized;
  }
  return "PASSED";
};

const normalizeTypes = (primary, fallback = []) => {
  if (Array.isArray(primary) && primary.length) {
    return primary;
  }
  if (Array.isArray(fallback) && fallback.length) {
    return fallback;
  }
  if (typeof primary === "string" && primary) {
    return [primary];
  }
  if (typeof fallback === "string" && fallback) {
    return [fallback];
  }
  return [];
};

const isStructuredFinding = (finding) => {
  if (!finding || typeof finding !== "object") return false;
  return (
    typeof finding.Title === "string" &&
    finding.Severity?.Label &&
    finding.Compliance?.Status
  );
};

const mapRawResource = (resource = {}) => ({
  Type: resource.Type || resource.type || resource.group?.name || "",
  Id:
    resource.Id ||
    resource.uid ||
    resource.arn ||
    resource.data?.metadata?.arn ||
    resource.metadata?.arn ||
    resource.name ||
    "",
  Partition: resource.Partition || resource.cloud_partition || "",
  Region:
    resource.Region ||
    resource.region ||
    resource.data?.metadata?.region ||
    resource.metadata?.region ||
    "",
});

const normalizeSingleFinding = (finding = {}) => {
  if (!finding || typeof finding !== "object") return null;

  const generatedId =
    finding?.Id ||
    finding?.finding_info?.uid ||
    finding?.uid ||
    finding?.unmapped?.uid ||
    randomUUID();

  const rawResources = Array.isArray(finding.Resources) && finding.Resources.length
    ? finding.Resources
    : Array.isArray(finding.resources)
      ? finding.resources
      : [];
  const resources = rawResources.map(mapRawResource);
  if (!resources.length && (finding?.Region || finding?.region)) {
    resources.push({
      Type: "",
      Id: finding?.ResourceId || finding?.resource_id || "",
      Partition: "",
      Region: finding?.Region || finding?.region || "",
    });
  }
  if (!resources.length) {
    resources.push({
      Type: "Unknown",
      Id: finding?.AwsAccountId || finding?.cloud?.account?.uid || generatedId,
      Partition: finding?.cloud?.partition || finding?.cloud_partition || "",
      Region: finding?.Region || finding?.region || "unknown",
    });
  }

  const severityLabel = (
    finding?.Severity?.Label ||
    (typeof finding?.severity === "string" ? finding.severity : undefined)
  )
    ? (finding?.Severity?.Label || finding.severity).toString().toUpperCase()
    : "UNKNOWN";

  const complianceStatusSource =
    finding?.Compliance?.Status || finding?.status_code || finding?.status;
  const complianceStatus = normalizeComplianceStatus(complianceStatusSource);

  const recommendationText =
    finding?.Remediation?.Recommendation?.Text ||
    finding?.remediation?.desc ||
    "";
  const recommendationUrl =
    finding?.Remediation?.Recommendation?.Url ||
    (Array.isArray(finding?.remediation?.references)
      ? finding.remediation.references[0]
      : "") ||
    "";

  const relatedRequirements =
    (Array.isArray(finding?.Compliance?.RelatedRequirements) &&
      finding.Compliance.RelatedRequirements.length)
      ? finding.Compliance.RelatedRequirements
      : Object.keys(finding?.unmapped?.compliance || {});

  const schemaVersion =
    finding?.SchemaVersion ||
    finding?.metadata?.schema_version ||
    finding?.metadata?.version ||
    "";

  const providerName =
    finding?.ProductFields?.ProviderName ||
    finding?.cloud?.provider ||
    finding?.metadata?.product?.name ||
    "";
  const providerVersion =
    finding?.ProductFields?.ProviderVersion ||
    finding?.metadata?.product?.version ||
    "";
  const resourceName =
    finding?.ProductFields?.ProwlerResourceName ||
    rawResources[0]?.name ||
    rawResources[0]?.Id ||
    "";

  const normalizedFinding = {
    SchemaVersion: schemaVersion,
    Id: generatedId,
    ProductArn: finding?.ProductArn || "",
    RecordState: finding?.RecordState || "ACTIVE",
    ProductFields: {
      ProviderName: providerName,
      ProviderVersion: providerVersion,
      ProwlerResourceName: resourceName,
    },
    GeneratorId:
      finding?.GeneratorId ||
      finding?.finding_info?.generator_id ||
      generatedId,
    AwsAccountId:
      finding?.AwsAccountId ||
      finding?.cloud?.account?.uid ||
      finding?.aws_account_id ||
      "",
    Types: normalizeTypes(finding?.Types, finding?.finding_info?.types),
    FirstObservedAt: parseDateSafe(
      finding?.FirstObservedAt ||
        finding?.time_dt ||
        finding?.created_at ||
        finding?.finding_info?.created_time_dt ||
        finding?.finding_info?.created_time
    ),
    UpdatedAt: parseDateSafe(
      finding?.UpdatedAt || finding?.updated_at || Date.now()
    ),
    CreatedAt: parseDateSafe(
      finding?.CreatedAt || finding?.time_dt || finding?.created_at || Date.now()
    ),
    Severity: {
      Label: severityLabel,
    },
    Title:
      finding?.Title ||
      finding?.finding_info?.title ||
      finding?.message ||
      "Security Finding",
    Description:
      finding?.Description ||
      finding?.message ||
      finding?.finding_info?.desc ||
      "",
    Resources: resources,
    Compliance: {
      Status: complianceStatus,
      RelatedRequirements: relatedRequirements,
      AssociatedStandards:
        Array.isArray(finding?.Compliance?.AssociatedStandards)
          ? finding.Compliance.AssociatedStandards
          : [],
    },
    Remediation: {
      Recommendation: {
        Text: recommendationText,
        Url: recommendationUrl,
      },
    },
  };

  return normalizedFinding;
};

export const normalizeFindings = (rawFindings = []) => {
  if (!Array.isArray(rawFindings)) {
    return { normalized: [], changed: true };
  }

  let changed = false;
  const normalized = rawFindings
    .map((finding) => {
      if (!finding || typeof finding !== "object") {
        changed = true;
        return null;
      }
      if (!isStructuredFinding(finding)) {
        changed = true;
      }
      return normalizeSingleFinding(finding);
    })
    .filter(Boolean);

  if (normalized.length !== rawFindings.length) {
    changed = true;
  }

  return { normalized, changed };
};

export const shouldRefreshMetadata = (findings, metadata) => {
  if (!metadata || !Object.keys(metadata).length) return true;
  return Number(metadata?.total_findings ?? -1) !== findings.length;
};
