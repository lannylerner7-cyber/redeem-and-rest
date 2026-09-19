import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ScousGiftCardExchange/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const matches = useMatches();
  const isDetail = matches.some((m) => m.routeId.endsWith("/admin/users/$id"));
  const [term, setTerm] = useState("");

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const wallets = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("user_id, balance_naira");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isDetail) return <Outlet />;

  const balance = new Map((wallets.data ?? []).map((w) => [w.user_id, Number(w.balance_naira)]));
  const list = (users.data ?? []).filter(
    (u) =>
      !term ||
      u.email.toLowerCase().includes(term.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-bold">Users</h1>
      <input
        placeholder="Search name or email"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="border-border bg-surface w-full rounded-xl border px-3 py-3 text-sm"
      />
      <div className="space-y-2">
        {list.map((u) => (
          <Link
            key={u.id}
            to="/ScousGiftCardExchange/admin/users/$id"
            params={{ id: u.id }}
            className="border-border/70 bg-surface hover:bg-surface-2 flex items-center justify-between rounded-2xl border p-4"
          >
            <div>
              <p className="text-sm font-semibold">{u.full_name || "Member"}</p>
              <p className="text-muted-foreground text-xs">{u.email}</p>
            </div>
            <p className="text-money text-sm font-bold">{naira(balance.get(u.id) ?? 0)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
