import { AuditLog } from "../models/schema.js";

async function logEvent(userId, type, status, details, reportUrl = null) {
  try {
    await AuditLog.create({
      userId,
      type,
      status,
      details,
      reportUrl,
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
}

export { logEvent };
