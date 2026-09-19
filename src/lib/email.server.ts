/**
 * Outgoing app email.
 *
 * Managed sending needs a verified sender domain for this project. Until one is
 * connected there is no way to deliver mail, so this helper reports that plainly
 * and the account flows degrade gracefully (see auth.functions.ts).
 *
 * When a sending domain is connected, replace the body of `sendEmail` with the
 * generated transactional email helper — nothing else in the app changes.
 */
export type SendResult = { sent: boolean; reason?: string };

export function emailConfigured(): boolean {
  return Boolean(process.env["APP_EMAIL_FROM"]);
}

export async function sendEmail(_input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!emailConfigured()) {
    return { sent: false, reason: "no_sender_domain" };
  }
  // Placeholder for the managed transactional sender.
  return { sent: false, reason: "no_sender_domain" };
}

export function otpEmailHtml(code: string, purpose: string) {
  return `
  <div style="font-family:system-ui,sans-serif;background:#0d1220;color:#f3f5f9;padding:32px;border-radius:16px">
    <h1 style="margin:0 0 8px;font-size:20px">ScousGiftCardExchange</h1>
    <p style="margin:0 0 20px;color:#a9b1c3">Your ${purpose} code</p>
    <p style="font-size:34px;letter-spacing:10px;font-weight:700;color:#f0c453;margin:0 0 16px">${code}</p>
    <p style="color:#a9b1c3;font-size:13px">This code expires in 10 minutes. If you didn't ask for it, ignore this email.</p>
  </div>`;
}

export function welcomeEmailHtml(name: string) {
  return `
  <div style="font-family:system-ui,sans-serif;background:#0d1220;color:#f3f5f9;padding:32px;border-radius:16px">
    <h1 style="margin:0 0 8px;font-size:20px">Welcome, ${name || "trader"} 👋</h1>
    <p style="color:#a9b1c3">Your ScousGiftCardExchange account is live. Add your bank details, pick a card brand and start trading for Naira.</p>
  </div>`;
}
