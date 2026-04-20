"use client";

import { useEffect, useState } from "react";
import { Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialRow {
  material_id: string;
  material_short_name: string;
  material_image_icon: string | null;
  current_stock_qty: number;
  uom: string;
  total_no_of_rolls: number;
  safety_stock_qty: number;
  re_order_qty: number;
  stock_status: "CRITICAL" | "LOW" | null;
}

export function PackagingMaterialsStock({ delay = 0 }: { delay?: number }) {
  const [materials, setMaterials]           = useState<MaterialRow[]>([]);
  const [progressWidths, setProgressWidths] = useState<number[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/packaging-materials-stock")
      .then(r => r.json())
      .then((data: MaterialRow[] | { error: string }) => {
        if (Array.isArray(data)) {
          setMaterials(data);
          setProgressWidths(data.map(() => 0));
          setTimeout(() => {
            setProgressWidths(
              data.map(m => {
                const max = Math.max(m.re_order_qty, m.current_stock_qty, 1);
                return Math.min((m.current_stock_qty / max) * 100, 100);
              })
            );
          }, delay + 300);
        } else {
          setError((data as { error: string }).error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load packaging materials stock"))
      .finally(() => setLoading(false));
  }, [delay]);

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

  if (materials.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border text-sm text-muted-foreground">
        No packaging material stock found.
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Packaging Materials Stock
        </h3>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[176px] pr-3">
        {materials.map((m, index) => (
          <div
            key={m.material_id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${delay + 200 + index * 150}ms` }}
          >
            {/* Name row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {m.material_image_icon ? (
                  <img
                    src={m.material_image_icon}
                    alt={m.material_short_name}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <Package className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {m.material_short_name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {m.current_stock_qty.toFixed(2)} {m.uom}
                </span>
                {m.total_no_of_rolls > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {m.total_no_of_rolls} Rolls
                  </span>
                )}
                {m.stock_status && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-semibold rounded uppercase",
                      m.stock_status === "LOW"      && "bg-warning/20 text-warning",
                      m.stock_status === "CRITICAL" && "bg-destructive/20 text-destructive animate-pulse-subtle"
                    )}
                  >
                    {m.stock_status}
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  m.stock_status === "CRITICAL" ? "bg-destructive" :
                  m.stock_status === "LOW"      ? "bg-warning"     : "bg-success"
                )}
                style={{ width: `${progressWidths[index] ?? 0}%` }}
              />
            </div>

            {/* Min / Reorder labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {m.safety_stock_qty.toLocaleString()}</span>
              <span>Reorder: {m.re_order_qty.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
