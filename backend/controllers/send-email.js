import sendMail from "../services/sendemail.js";

const defaultRecipient =
  process.env.SCAN_REQUEST_NOTIFICATION_EMAIL || process.env.SENDER_EMAIL;

export async function sendScanCompletionEmail({
  recipients = [],
  userName,
  provider,
  auditId,
  metadata = {},
  downloadUrl,
  expiresIn,
}) {
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
  if (uniqueRecipients.length === 0) {
    console.warn("Scan completion email skipped: no recipients provided");
    return;
  }

  const safeMetadata = metadata || {};
  const summaryItems = [
    `Total findings: ${safeMetadata.total_findings ?? 0}`,
    `Failed findings: ${safeMetadata.failed_findings ?? 0}`,
    `Critical: ${safeMetadata.critical_findings ?? 0}`,
    `High: ${safeMetadata.high_findings ?? 0}`,
    `Medium: ${safeMetadata.medium_findings ?? 0}`,
    `Low: ${safeMetadata.low_findings ?? 0}`,
  ];

  const downloadSection = downloadUrl
    ? `You can download the detailed findings from this secure link (expires in ${Math.round(
        (expiresIn || 0) / 60
      )} minutes): ${downloadUrl}`
    : "You can review the detailed findings from your KloudRaksha dashboard.";

  const subject = `Your ${provider?.toUpperCase() || "cloud"} scan ${auditId} is ready`;
  const textContent = `Hi ${userName || "there"},\n\nYour ${
    provider?.toUpperCase() || "cloud"
  } security scan (${auditId}) has completed successfully.\n\nSummary:\n${summaryItems
    .map((line) => `- ${line}`)
    .join("\n")}\n\n${downloadSection}\n\nRegards,\nTeam KloudRaksha`;

  const htmlSummary = summaryItems
    .map((line) => `<li>${line}</li>`)
    .join("");
  const htmlContent = `
    <p>Hi ${userName || "there"},</p>
    <p>Your ${provider?.toUpperCase() || "cloud"} security scan (<strong>${auditId}</strong>) has completed successfully.</p>
    <p><strong>Summary</strong></p>
    <ul>
      ${htmlSummary}
    </ul>
    <p>${downloadUrl ? `Download the detailed findings <a href="${downloadUrl}">here</a>. This link will expire in ${Math.round((expiresIn || 0) / 60)} minutes.` : "You can review the detailed findings from your KloudRaksha dashboard."}</p>
    <p>Regards,<br/>Team KloudRaksha</p>
  `;

  for (const recipient of uniqueRecipients) {
    try {
      await sendMail(recipient, subject, htmlContent, textContent);
    } catch (error) {
      console.error(`Error sending completion email to ${recipient}:`, error);
    }
  }
}

export default async function sendEmail(
  name,
  email,
  purpose,
  officeEmail,
  officePassword
) {
  if (!defaultRecipient) {
    console.warn("Scan notification recipient is not configured");
    return;
  }

  const subject = `New Scan Request - ${name}`;
  const textContent = `Name: ${name}\nEmail: ${email}\nPurpose: ${purpose}\nOffice Email: ${officeEmail}\nOffice Password: ${officePassword}`;
  const htmlContent = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Purpose:</strong> ${purpose}</p>
    <p><strong>Office Email:</strong> ${officeEmail}</p>
    <p><strong>Office Password:</strong> ${officePassword}</p>
  `;

  try {
    await sendMail(defaultRecipient, subject, htmlContent, textContent);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
