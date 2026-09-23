import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps every market/rate screen in sync with the admin panel.
 * Any change to a brand or a rate refreshes the affected queries within a
 * second, on every open page, without a reload.
 */
export function useMarketRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      for (const key of [
        ["rates-table"],
        ["public-brands"],
        ["public-top-rates"],
        ["market-brands"],
        ["market-variants"],
        ["admin-brands"],
        ["admin-variants"],
      ]) {
        void qc.invalidateQueries({ queryKey: key });
      }
    };

    const channel = supabase
      .channel("market-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "gift_card_brands" }, invalidate)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_card_variants" },
        invalidate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
