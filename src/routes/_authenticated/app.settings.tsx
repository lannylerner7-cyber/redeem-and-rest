import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Lock, LogOut, Plus, Shield, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/hooks/useAuth";
import { requestOtp } from "@/lib/auth.functions";
import { resetWithdrawalPin } from "@/lib/pin.functions";
import { soundEnabled, setSoundEnabled } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: Settings,
});

type PinStatus = {
  has_pin: boolean;
  locked_until: string | null;
  frozen: boolean;
  frozen_reason: string | null;
};

function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useSession();
  const { isAdmin } = useIsAdmin(user);

  const [adding, setAdding] = useState(false);
  const [bankId, setBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [sound, setSound] = useState(() => soundEnabled());
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetCode, setResetCode] = useState("");

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const banks = useQuery({
    queryKey: ["bank-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banks")
        .select("id, name, code, is_digital")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const accounts = useQuery({
    queryKey: ["my-banks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("id, bank_name, bank_code, account_number, account_name, is_default")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addAccount = useMutation({
    mutationFn: async () => {
      const bank = banks.data?.find((b) => b.id === bankId);
      if (!bank) throw new Error("Choose your bank");
      if (accountNumber.length !== 10) throw new Error("Account number must be 10 digits");
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("bank_accounts").insert({
        user_id: user.id,
        bank_id: bank.id,
        bank_name: bank.name,
        bank_code: bank.code,
        account_number: accountNumber,
        account_name: accountName.trim(),
        is_default: (accounts.data ?? []).length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank account saved");
      setAdding(false);
      setBankId("");
      setAccountNumber("");
      setAccountName("");
      void qc.invalidateQueries({ queryKey: ["my-banks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makeDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not signed in");
      await supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await supabase.from("bank_accounts").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my-banks"] }),
  });

  const removeAccount = useMutation({
    mutationFn: async (id: string) => {
      const pending = await supabase
        .from("withdrawals")
        .select("id")
        .eq("bank_account_id", id)
        .in("status", ["requested", "approved"]);
      if ((pending.data ?? []).length > 0)
        throw new Error("This account has a withdrawal in progress");
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank account removed");
      void qc.invalidateQueries({ queryKey: ["my-banks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pinStatus = useQuery({
    queryKey: ["pin-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("withdrawal_pin_status");
      if (error) throw error;
      return data as unknown as PinStatus;
    },
  });

  const savePin = useMutation({
    mutationFn: async () => {
      if (!/^\d{4}$/.test(newPin)) throw new Error("PIN must be 4 digits");
      const { error } = await supabase.rpc("set_withdrawal_pin", {
        p_pin: newPin,
        ...(pinStatus.data?.has_pin ? { p_current_pin: currentPin } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Withdrawal PIN saved");
      setNewPin("");
      setCurrentPin("");
      void qc.invalidateQueries({ queryKey: ["pin-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startReset = useMutation({
    mutationFn: async () => {
      const email = profile.data?.email;
      if (!email) throw new Error("No email on file");
      const res = await requestOtp({ data: { email, purpose: "pin" } });
      if (!res.ok) throw new Error("Please wait a moment before asking for another code");
    },
    onSuccess: () => {
      setResetting(true);
      toast.success("We sent a code to your email");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finishReset = useMutation({
    mutationFn: async () => {
      const res = await resetWithdrawalPin({ data: { code: resetCode, pin: newPin } });
      if (!res.ok) {
        throw new Error(
          res.error === "wrong"
            ? "Invalid OTP — check the code and try again."
            : "That code has expired. Send a new one.",
        );
      }
    },
    onSuccess: () => {
      toast.success("Withdrawal PIN updated");
      setResetting(false);
      setResetCode("");
      setNewPin("");
      void qc.invalidateQueries({ queryKey: ["pin-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold">Settings</h1>

      <section className="border-border/70 bg-surface rounded-2xl border p-5">
        <p className="text-sm font-semibold">{profile.data?.full_name ?? "Member"}</p>
        <p className="text-muted-foreground text-xs">{profile.data?.email}</p>
        {profile.data?.phone && (
          <p className="text-muted-foreground text-xs">{profile.data.phone}</p>
        )}
      </section>

      {isAdmin && (
        <a
          href="/ScousGiftCardExchange/admin"
          className="border-primary/40 bg-primary/10 text-primary flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-semibold"
        >
          <Shield className="h-4 w-4" /> Open admin panel
        </a>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-semibold uppercase">Bank accounts</p>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-primary flex items-center gap-1 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {adding && (
          <div className="border-border/70 bg-surface space-y-3 rounded-2xl border p-4">
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="border-border bg-surface-2 w-full rounded-xl border px-3 py-3 text-sm"
            >
              <option value="">Select bank</option>
              {(banks.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.is_digital ? " (digital)" : ""}
                </option>
              ))}
            </select>
            <input
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
              className="border-border bg-surface-2 w-full rounded-xl border px-3 py-3 text-sm"
            />
            <input
              placeholder="Account name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="border-border bg-surface-2 w-full rounded-xl border px-3 py-3 text-sm"
            />
            <button
              type="button"
              disabled={addAccount.isPending}
              onClick={() => addAccount.mutate()}
              className="bg-gold-gradient text-primary-foreground flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold"
            >
              {addAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save account
            </button>
          </div>
        )}

        {(accounts.data ?? []).map((a) => (
          <div
            key={a.id}
            className="border-border/70 bg-surface flex items-center justify-between rounded-2xl border p-4"
          >
            <div>
              <p className="text-sm font-semibold">{a.bank_name}</p>
              <p className="text-muted-foreground text-xs">
                {a.account_number} · {a.account_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => makeDefault.mutate(a.id)}
                aria-label="Set as default"
                className={cn(a.is_default ? "text-primary" : "text-muted-foreground")}
              >
                <Star className={cn("h-4 w-4", a.is_default && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={() => removeAccount.mutate(a.id)}
                aria-label="Remove account"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {(accounts.data ?? []).length === 0 && !adding && (
          <p className="text-muted-foreground text-sm">No bank account saved yet.</p>
        )}
      </section>

      <section className="border-border/70 bg-surface flex items-center justify-between rounded-2xl border p-4">
        <span className="text-sm font-semibold">Sound effects</span>
        <button
          type="button"
          onClick={() => {
            const next = !sound;
            setSound(next);
            setSoundEnabled(next);
          }}
          className={cn(
            "h-6 w-11 rounded-full transition-colors",
            sound ? "bg-money" : "bg-muted-foreground/40",
          )}
          aria-label="Toggle sound"
        >
          <span
            className={cn(
              "bg-background block h-5 w-5 rounded-full transition-transform",
              sound ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </section>

      <button
        type="button"
        onClick={signOut}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 flex w-full items-center justify-center gap-2 rounded-full border py-3.5 text-sm font-semibold"
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}
