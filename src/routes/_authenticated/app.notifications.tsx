import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/lib/format";
import { playChime } from "@/lib/sounds";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  component: Notifications,
});

function Notifications() {
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, link, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          playChime();
          void qc.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold">Notifications</h1>

      {items.isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-2 shimmer h-20 rounded-2xl" />
        ))}

      {!items.isLoading && (items.data ?? []).length === 0 && (
        <div className="border-border/70 bg-surface rounded-2xl border p-10 text-center">
          <Bell className="text-muted-foreground mx-auto h-6 w-6" />
          <p className="mt-2 text-sm font-semibold">Nothing yet</p>
        </div>
      )}

      {(items.data ?? []).map((n) => (
        <div key={n.id} className="border-border/70 bg-surface rounded-2xl border p-4">
          <p className="text-sm font-semibold">{n.title}</p>
          {n.body && <p className="text-muted-foreground mt-1 text-xs">{n.body}</p>}
          <p className="text-muted-foreground mt-2 text-[10px]">{shortDate(n.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
