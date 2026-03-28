import { resend, EMAIL_FROM } from "./resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxx") {
    console.log(`[Email] Skipped (no API key): ${subject} -> ${to}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Error sending to ${to}:`, error);
    } else {
      console.log(`[Email] Sent successfully: ${subject} -> ${to}`);
    }
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err);
  }
}
