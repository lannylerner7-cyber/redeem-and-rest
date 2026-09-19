import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ScousGiftCardExchange/admin/audit")({
  component: AdminAudit,
});

function AdminAudit() {
  const rows = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, action, target_type, target_id, after, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-bold">Audit log</h1>
      <div className="space-y-2">
        {(rows.data ?? []).map((r) => (
          <div key={r.id} className="border-border/70 bg-surface rounded-2xl border p-4">
            <p className="text-sm font-semibold">{r.action}</p>
            <p className="text-muted-foreground text-xs">
              {r.target_type} · {shortDate(r.created_at)}
            </p>
            <pre className="text-muted-foreground mt-2 overflow-x-auto text-[10px]">
              {JSON.stringify(r.after, null, 1)}
            </pre>
          </div>
        ))}
        {!rows.isLoading && (rows.data ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">No admin actions recorded yet.</p>
        )}
      </div>
    </div>
  );
}
