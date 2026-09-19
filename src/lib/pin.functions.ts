import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    const { verifyOtpCode } = await import("./auth.functions");
    const check = await verifyOtpCode({ data: { email, purpose: "pin", code: data.code } });
    if (!check.ok) return { ok: false as const, error: check.error };

    const { error } = await supabaseAdmin.rpc("force_set_withdrawal_pin", {
      p_user_id: context.userId,
      p_pin: data.pin,
    });
    if (error) return { ok: false as const, error: "failed" };
    return { ok: true as const };
  });
