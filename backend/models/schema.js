import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    subscription: {
      planId: { type: String },
      planName: {
        type: String,
        enum: ["Basic", "Pro", "Enterprise", "Free"],
        default: "Free",
      },
      status: {
        type: String,
        enum: ["created", "active", "inactive", "cancelled"],
        default: "inactive",
      },
      amount: { type: Number },
      subscriptionId: { type: String },
      current_period_start: { type: Date },
      current_period_end: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

const scanRequestSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    purpose: { type: String, required: true },
    officeEmail: { type: String, required: true },
    provider: { type: String, enum: ["aws", "gcp", "azure"], required: true },
    awsSecretKey: { type: String },
    awsSecretPassword: { type: String },
    azureClientId: { type: String },
    azureClientSecret: { type: String },
    azureTenantId: { type: String },
    gcpClientId: { type: String },
    gcpClientSecret: { type: String },
    gcpTenantId: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const ScanRequest = mongoose.model("ScanRequest", scanRequestSchema);

// Schema for Compliance Standards
const complianceStandardsSchema = new Schema({
  StandardsId: { type: String, required: true },
});

// Schema for Compliance
const complianceSchema = new Schema({
  Status: { type: String, enum: ["FAILED", "PASSED"], required: true },
  RelatedRequirements: [{ type: String }],
  AssociatedStandards: [complianceStandardsSchema],
});

// Schema for Remediation
const remediationSchema = new Schema({
  Recommendation: {
    Text: { type: String, required: true },
    Url: { type: String },
  },
});

// Schema for Resources
const resourcesSchema = new Schema({
  Type: { type: String, required: true },
  Id: { type: String, required: true },
  Partition: { type: String, required: true },
  Region: { type: String, required: true },
});

const reportFileSchema = new Schema(
  {
    filename: { type: String },
    key: { type: String, required: true },
    bucket: { type: String, required: true },
    region: { type: String },
    mime_type: { type: String },
    size: { type: Number },
    type: { type: String },
  },
  { _id: false }
);

const uploadErrorSchema = new Schema(
  {
    file: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Schema for Individual Finding
const findingSchema = new Schema({
  SchemaVersion: { type: String, required: true },
  Id: { type: String, required: true },
  ProductArn: { type: String, required: true },
  RecordState: { type: String, enum: ["ACTIVE", "ARCHIVED"], required: true },
  ProductFields: {
    ProviderName: { type: String, required: true },
    ProviderVersion: { type: String, required: true },
    ProwlerResourceName: { type: String, required: true },
  },
  GeneratorId: { type: String, required: true },
  AwsAccountId: { type: String, required: true },
  Types: [{ type: String }],
  FirstObservedAt: { type: Date, required: true },
  UpdatedAt: { type: Date, required: true },
  CreatedAt: { type: Date, required: true },
  Severity: {
    Label: { type: String, required: true },
  },
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Resources: [resourcesSchema],
  Compliance: complianceSchema,
  Remediation: remediationSchema,
});

// Schema for User Info
const userInfoSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  purpose: { type: String, required: true },
  officeEmail: { type: String, required: true },
  provider: { type: String, enum: ["aws", "gcp", "azure"], required: true },
  awsSecretKey: { type: String },
  awsSecretPassword: { type: String },
  azureClientId: { type: String },
  azureClientSecret: { type: String },
  azureTenantId: { type: String },
  gcpClientId: { type: String },
  gcpClientSecret: { type: String },
  gcpTenantId: { type: String },
});

const metaDataSchema = new Schema({
  aws_account_id: { type: String, required: true },
  total_findings: { type: Number, required: true },
  failed_findings: { type: Number, required: true },
  passed_findings: { type: Number, required: true },
  critical_findings: { type: Number, required: true },
  high_findings: { type: Number, required: true },
  medium_findings: { type: Number, required: true },
  low_findings: { type: Number, required: true },
});

const clusterSchema = new Schema({
  primaryId: { type: String, required: true },
  clusteredIds: { type: [String], required: true },
});

// Main Audit Schema
const auditSchema = new Schema(
  {
    data: { type: [findingSchema] },
    created_at: { type: Date, default: Date.now },
    user_id: { type: String, ref: "User", required: true },
    audit_id: { type: String, required: true },
    user_info: { type: userInfoSchema, required: true },
    metadata: { type: metaDataSchema },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    report_s3_key: { type: String },
    report_s3_bucket: { type: String },
    report_s3_region: { type: String },
    report_files: { type: [reportFileSchema], default: [] },
    upload_errors: { type: [uploadErrorSchema], default: [] },
    is_verified: { type: Boolean, default: false },
    removed_items: { type: [String] || undefined, default: undefined },
    clustering: { type: [clusterSchema] || undefined, default: undefined },
    provider: { type: String, enum: ["aws", "gcp", "azure"], required: true },
    credentials: {
      aws: {
        awsSecretKey: { type: String },
        awsSecretPassword: { type: String },
      },
      azure: {
        clientId: { type: String },
        clientSecret: { type: String },
        tenantId: { type: String },
      },
      gcp: {
        clientId: { type: String },
        clientSecret: { type: String },
        tenantId: { type: String },
      },
    },
  },
  { timestamps: true }
);

const Scanrequests = mongoose.model("Scanrequests", auditSchema);

const AuditActionType = {
  // User Actions
  LOGIN: "Login",
  LOGOUT: "Logout",
  PROFILE_UPDATE: "Profile Update",

  // Admin Actions
  USER_MANAGEMENT: "User Management",
  ROLE_CHANGE: "Role Change",

  // Subscription Actions
  SUBSCRIPTION_CREATE: "Subscription Created",
  SUBSCRIPTION_UPDATE: "Subscription Updated",

  // Scan/Audit Actions
  SCAN_INITIATED: "Scan Initiated",
  SCAN_COMPLETED: "Scan Completed",
  SCAN_REVIEWED: "Scan Reviewed",
};



const ResultsSchema = new mongoose.Schema({
  audit_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  data: { type: Array, default: [] },          // Array of audit findings
  metadata: { type: Object, default: {} },
  user_info: { type: Object, default: {} },
  created_at: { type: String },
  s3_report_key: { type: String },
  s3_report_bucket: { type: String },
  s3_report_region: { type: String },
  report_files: { type: [reportFileSchema], default: [] },
  upload_errors: { type: [uploadErrorSchema], default: [] }
}, { collection: 'results' }); // explicitly link to 'results' collection


// Updated AuditLog Schema
const auditLogSchema = new Schema({
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(AuditActionType),
  },
  status: {
    type: String,
    required: true,
    enum: ["Passed", "Failed", "Pending"],
    default: "Pending",
  },
  details: {
    audit_id: {
      type: String,
    },
    action: {
      type: String,
      enum: ["Approved", "Rejected", "Under Review", "Initiated", "Completed"],
    },
  },
  reportUrl: String,
  assignedTo: {
    type: String,
    ref: "User",
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for better query performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ type: 1 });

// Update timestamps automatically
auditLogSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export { User, ScanRequest, Scanrequests, AuditLog, AuditActionType };
export const Results = mongoose.model('Results', ResultsSchema);
