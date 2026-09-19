import { createServerFn, getRequest } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function siteUrl() {
  try {
    const req = getRequest();
    return new URL(req.url).origin;
  } catch {
    return process.env["APP_URL"] ?? "";
  }
}

async function alertRecipients() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("alert_emails")
    .eq("id", true)
    .maybeSingle();
  return ((data?.alert_emails as string[] | null) ?? []).filter(Boolean);
}

const naira = (v: number) => `₦${Number(v).toLocaleString("en-NG")}`;

/** Email the admin alert addresses about a freshly submitted card. */
export const notifyTradeSubmitted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { tradeId: string }) => z.object({ tradeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, tradeAlertEmail } = await import("./email.server");

    const { data: trade } = await supabaseAdmin
      .from("trades")
      .select(
        "id, user_id, brand_name, region_code, card_type, face_value, currency, expected_payout",
      )
      .eq("id", data.tradeId)
      .maybeSingle();
    if (!trade || trade.user_id !== context.userId) return { sent: false as const };

    const [{ data: profile }, { count }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", trade.user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("trade_images")
        .select("id", { count: "exact", head: true })
        .eq("trade_id", trade.id),
    ]);

    const to = await alertRecipients();
    if (to.length === 0) return { sent: false as const };

    const mail = tradeAlertEmail({
      member: profile?.full_name || "Member",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "not provided",
      brand: trade.brand_name,
      region: trade.region_code,
      cardType: trade.card_type === "ecode" ? "E-code" : "Physical",
      faceValue: `${trade.currency} ${Number(trade.face_value).toLocaleString()}`,
      payout: naira(Number(trade.expected_payout)),
      reference: trade.id.slice(0, 8).toUpperCase(),
      images: count ?? 0,
      link: `${siteUrl()}/ScousGiftCardExchange/admin/trades/${trade.id}`,
    });
    const res = await sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text });
    return { sent: res.sent };
  });

/** Email the admin alert addresses about a new withdrawal request. */
export const notifyWithdrawalRequested = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { withdrawalId: string }) =>
    z.object({ withdrawalId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, withdrawalAlertEmail } = await import("./email.server");

    const { data: w } = await supabaseAdmin
      .from("withdrawals")
      .select("id, user_id, amount, fee, net_amount, bank_snapshot")
      .eq("id", data.withdrawalId)
      .maybeSingle();
    if (!w || w.user_id !== context.userId) return { sent: false as const };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", w.user_id)
      .maybeSingle();

    const to = await alertRecipients();
    if (to.length === 0) return { sent: false as const };

    const snap = (w.bank_snapshot ?? {}) as {
      bank_name?: string;
      account_number?: string;
      account_name?: string;
    };

    const mail = withdrawalAlertEmail({
      member: profile?.full_name || "Member",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "not provided",
      amount: naira(Number(w.amount)),
      fee: naira(Number(w.fee)),
      net: naira(Number(w.net_amount)),
      bankName: snap.bank_name ?? "",
      accountNumber: snap.account_number ?? "",
      accountName: snap.account_name ?? "",
      reference: w.id.slice(0, 8).toUpperCase(),
      link: `${siteUrl()}/ScousGiftCardExchange/admin/withdrawals`,
    });
    const res = await sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text });
    return { sent: res.sent };
  });

/** Public contact form on the homepage. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; message: string }) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(200),
        message: z.string().trim().min(5).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, contactAlertEmail } = await import("./email.server");

    // Simple flood guard: max 3 messages per email address per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email.toLowerCase())
      .gte("created_at", since);
    if ((count ?? 0) >= 3) return { ok: false as const, error: "too_many" };

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      message: data.message,
    });
    if (error) return { ok: false as const, error: "failed" };

    const to = await alertRecipients();
    if (to.length > 0) {
      const mail = contactAlertEmail({
        name: data.name,
        email: data.email.toLowerCase(),
        message: data.message,
      });
      await sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text });
    }
    return { ok: true as const };
  });

/** Admin console: is mail wired up, and does a test message arrive? */
export const mailStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Not authorised");
    const { mailConfig } = await import("./email.server");
    const cfg = mailConfig();
    return {
      configured: cfg !== null,
      host: cfg?.host ?? null,
      port: cfg?.port ?? null,
      secure: cfg?.secure ?? null,
      from: cfg?.from ?? null,
      replyTo: cfg?.replyTo ?? null,
    };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string }) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Not authorised");
    const { sendEmail, testEmail } = await import("./email.server");
    const mail = testEmail();
    const res = await sendEmail({
      to: data.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    return res;
  });

/** Spam-word check for the admin mail screen. */
export const checkSpamWords = createServerFn({ method: "POST" })
  .inputValidator((d: { text: string }) => z.object({ text: z.string().max(5000) }).parse(d))
  .handler(async ({ data }) => {
    const { spamScan } = await import("./email.server");
    return { hits: spamScan(data.text) };
  });
