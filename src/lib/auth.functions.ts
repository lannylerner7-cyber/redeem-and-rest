import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const purposeSchema = z.enum(["signup", "login", "reset", "pin"]);
export type OtpPurpose = z.infer<typeof purposeSchema>;

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sixDigits() {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
}

export const OTP_TTL_MIN = 5;
const RESEND_COOLDOWN_S = 60;
const MAX_RESENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 3;

/** Issue a fresh code, invalidating any previous unused one. */
export const requestOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; purpose: OtpPurpose }) =>
    z.object({ email: z.string().email(), purpose: purposeSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, otpEmail, emailConfigured } = await import("./email.server");
    const email = data.email.trim().toLowerCase();
    const now = new Date();

    const { data: recent } = await supabaseAdmin
      .from("otp_codes")
      .select("id, created_at, resend_count")
      .eq("email", email)
      .eq("purpose", data.purpose)
      .gte("created_at", new Date(now.getTime() - 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    const rows = recent ?? [];
    if (rows.length > 0) {
      const last = new Date(rows[0]!.created_at as string);
      const elapsed = (now.getTime() - last.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_S) {
        return {
          ok: false as const,
          error: "cooldown",
          retryIn: Math.ceil(RESEND_COOLDOWN_S - elapsed),
        };
      }
    }
    if (rows.length >= MAX_RESENDS_PER_HOUR) {
      return { ok: false as const, error: "too_many", retryIn: 3600 };
    }

    // Invalidate previous codes for this email + purpose.
    await supabaseAdmin
      .from("otp_codes")
      .update({ consumed_at: now.toISOString() })
      .eq("email", email)
      .eq("purpose", data.purpose)
      .is("consumed_at", null);

    const code = sixDigits();
    const expires = new Date(now.getTime() + OTP_TTL_MIN * 60 * 1000);
    await supabaseAdmin.from("otp_codes").insert({
      email,
      purpose: data.purpose,
      code_hash: await sha256(`${email}:${code}`),
      expires_at: expires.toISOString(),
      resend_count: rows.length,
    });

    const mail = otpEmail(code, data.purpose, OTP_TTL_MIN);
    const result = await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    return {
      ok: true as const,
      delivered: result.sent,
      emailConfigured: emailConfigured(),
      expiresAt: expires.toISOString(),
      ttlMinutes: OTP_TTL_MIN,
    };
  });

/** Check a code and, when valid, mark the account verified. */
export const verifyOtpCode = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; purpose: OtpPurpose; code: string }) =>
    z
      .object({
        email: z.string().email(),
        purpose: purposeSchema,
        code: z.string().regex(/^\d{6}$/),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: row } = await supabaseAdmin
      .from("otp_codes")
      .select("id, code_hash, expires_at, attempts")
      .eq("email", email)
      .eq("purpose", data.purpose)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { ok: false as const, error: "no_code" };
    if (new Date(row.expires_at as string) < new Date())
      return { ok: false as const, error: "expired" };
    if ((row.attempts as number) >= MAX_ATTEMPTS) return { ok: false as const, error: "attempts" };

    const hash = await sha256(`${email}:${data.code}`);
    if (hash !== row.code_hash) {
      const attempts = (row.attempts as number) + 1;
      await supabaseAdmin.from("otp_codes").update({ attempts }).eq("id", row.id as string);
      if (attempts >= MAX_ATTEMPTS) {
        // Burn the code after three wrong tries so a new one has to be sent.
        await supabaseAdmin
          .from("otp_codes")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", row.id as string);
        return { ok: false as const, error: "attempts" };
      }
      return { ok: false as const, error: "wrong", remaining: MAX_ATTEMPTS - attempts };
    }

    await supabaseAdmin
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id as string);

    if (data.purpose === "signup") {
      await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("email", email);
    }
    return { ok: true as const };
  });

/** Is this email currently locked out? */
export const loginGate = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, deleted_at")
      .eq("email", email)
      .maybeSingle();
    if (!profile || profile.deleted_at) return { ok: false as const, error: "unknown_user" };

    const { data: locked } = await supabaseAdmin
      .from("login_attempts")
      .select("locked_until")
      .eq("email", email)
      .gt("locked_until", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (locked?.locked_until) {
      return { ok: false as const, error: "locked", until: locked.locked_until as string };
    }
    return { ok: true as const };
  });

/** Record a login outcome; three failures in 15 minutes locks for 30. */
export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; succeeded: boolean }) =>
    z.object({ email: z.string().email(), succeeded: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const now = new Date();

    if (data.succeeded) {
      await supabaseAdmin.from("login_attempts").insert({ email, succeeded: true });
      return { locked: false as const };
    }

    const windowStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const { data: fails } = await supabaseAdmin
      .from("login_attempts")
      .select("id")
      .eq("email", email)
      .eq("succeeded", false)
      .gte("created_at", windowStart);

    const failures = (fails?.length ?? 0) + 1;
    const lockedUntil =
      failures >= 3 ? new Date(now.getTime() + 30 * 60 * 1000).toISOString() : null;

    await supabaseAdmin
      .from("login_attempts")
      .insert({ email, succeeded: false, locked_until: lockedUntil });

    return {
      locked: Boolean(lockedUntil),
      until: lockedUntil,
      remaining: Math.max(0, 3 - failures),
    };
  });

/** Finish signup: welcome email + verification fallback when mail is unavailable. */
export const completeSignup = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; fullName: string }) =>
    z.object({ email: z.string().email(), fullName: z.string().max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail, welcomeEmail, emailConfigured } = await import("./email.server");
    const email = data.email.trim().toLowerCase();

    if (!emailConfigured()) {
      // No mail account connected yet: don't lock people out of their own account.
      await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("email", email);
      return { verifiedWithoutEmail: true as const };
    }

    const mail = welcomeEmail(data.fullName);
    await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    return { verifiedWithoutEmail: false as const };
  });
