"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockRow {
  material_id: string;
  material_short_name: string;
  material_image_icon: string | null;
  required_kgs_per_day: number;
  current_stock_qty: number;
  uom: string;
  days_of_stock: number | null;
  po_qty: number | null;
  po_uom: string | null;
}

export function DaysOfStock({ delay = 0 }: { delay?: number }) {
  const [rows, setRows]       = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/days-of-stock")
      .then(r => r.json())
      .then((data: StockRow[] | { error: string }) => {
        if (Array.isArray(data)) setRows(data);
        else setError((data as { error: string }).error ?? "Failed to load");
      })
      .catch(() => setError("Failed to load days of stock"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border animate-pulse h-48" />
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-destructive text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border text-sm text-muted-foreground">
        No active batch BOM data found.
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Days of Stock
        </h3>
      </div>

      {/* 2-col grid, scrollable after 4 cards (2 rows × ~96px each ≈ 200px) */}
      <div className="overflow-y-auto max-h-[200px] pr-1">
        <div className="grid grid-cols-2 gap-4">
          {rows.map((row, index) => {
            const days  = row.days_of_stock;
            const isLow = days !== null && days <= 5;

            return (
              <div
                key={row.material_id}
                className={cn(
                  "rounded-lg border-2 p-4 animate-fade-in-up",
                  isLow
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    : "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                )}
                style={{ animationDelay: `${delay + 200 + index * 100}ms` }}
              >
                <p className="text-sm text-muted-foreground mb-2">
                  {row.material_short_name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-3xl font-bold",
                      isLow
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {days ?? "—"}
                  </span>
                  {days !== null && (
                    <span className="text-sm text-muted-foreground">days</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
