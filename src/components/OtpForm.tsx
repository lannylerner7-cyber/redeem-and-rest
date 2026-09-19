import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { requestOtp, verifyOtpCode } from "@/lib/auth.functions";

const ERRORS: Record<string, string> = {
  no_code: "That code has expired. Send a new one.",
  expired: "That code has expired. Send a new one.",
  attempts: "Too many wrong tries. Send a new code.",
  wrong: "That code isn't right. Check and try again.",
};

export function OtpForm({
  email,
  purpose,
  onVerified,
}: {
  email: string;
  purpose: "signup" | "login" | "reset";
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(45);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function submit(value: string) {
    setBusy(true);
    const res = await verifyOtpCode({ data: { email, purpose, code: value } });
    setBusy(false);
    if (!res.ok) {
      setCode("");
      toast.error(ERRORS[res.error] ?? "Couldn't verify that code.");
      return;
    }
    onVerified();
  }

  async function resend() {
    setBusy(true);
    const res = await requestOtp({ data: { email, purpose } });
    setBusy(false);
    if (!res.ok) {
      toast.error(
        res.error === "cooldown"
          ? `Hold on ${res.retryIn}s before asking for another code.`
          : "Too many codes requested. Try again later.",
      );
      setCooldown(res.retryIn ?? 60);
      return;
    }
    setCooldown(60);
    toast.success("New code sent.");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (v.length === 6) void submit(v);
          }}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="h-14 w-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {busy && (
        <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking…
        </p>
      )}

      <button
        type="button"
        onClick={resend}
        disabled={cooldown > 0 || busy}
        className="text-primary w-full text-center text-sm font-semibold disabled:opacity-50"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Send me a new code"}
      </button>
    </div>
  );
}
