import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Reset a forgotten withdrawal PIN. The member proves ownership with a code
 * emailed to their own address (purpose "pin"), then the new PIN is written
 * with the service role because the normal path requires the old PIN.
 */
export const resetWithdrawalPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; pin: string }) =>
    z
      .object({
        code: z.string().regex(/^\d{6}$/),
        pin: z.string().regex(/^\d{4}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();
    const email = (profile?.email ?? "").toLowerCase();
    if (!email) return { ok: false as const, error: "no_code" };

    const { data: row } = await supabaseAdmin
      .from("otp_codes")
      .select("id, code_hash, expires_at, attempts")
      .eq("email", email)
      .eq("purpose", "pin")
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return { ok: false as const, error: "no_code" };
    if (new Date(row.expires_at as string) < new Date())
      return { ok: false as const, error: "expired" };
    if ((row.attempts as number) >= 3) return { ok: false as const, error: "attempts" };

    if ((await sha256(`${email}:${data.code}`)) !== row.code_hash) {
      await supabaseAdmin
        .from("otp_codes")
        .update({ attempts: (row.attempts as number) + 1 })
        .eq("id", row.id as string);
      return { ok: false as const, error: "wrong" };
    }

    await supabaseAdmin
      .from("otp_codes")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id as string);

    const { error } = await supabaseAdmin.rpc("force_set_withdrawal_pin", {
      p_user_id: context.userId,
      p_pin: data.pin,
    });
    if (error) return { ok: false as const, error: "failed" };
    return { ok: true as const };
  });
