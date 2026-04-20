"use client";

import { useEffect, useState } from "react";
import { Package, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockRow {
  product_status: string;
  seq_no: number;
  total_no_of_cartons: number;
  pack_size_short_name: string;
  packs_per_carton: number;
  total_no_of_packs: number;
  total_no_of_sachets: number;
}

interface BatchData {
  batch_no: string;
  product_id: string;
  product_shortname: string;
  product_image_icon: string | null;
  total_sachets: number;
  manufactured: { kgs: number; sachets: number };
  stock_rows: StockRow[];
}

const STAGE_COLORS = [
  "bg-primary",
  "bg-chart-target",
  "bg-warning",
  "bg-success",
  "bg-destructive",
];

function fmtK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return Math.floor(n / 1_000) + "K";
  return n.toLocaleString();
}

function BatchCard({ batch, delay }: { batch: BatchData; delay: number }) {
  const [countVal, setCountVal]         = useState(0);
  const [progressWidths, setProgressWidths] = useState<number[]>([]);

  // Build unified stage list: Manufactured + stock_rows
  const stages = [
    {
      label:   "MANUFACTURED",
      sachets: batch.manufactured.sachets,
      detail:  `${batch.manufactured.kgs.toFixed(2)} KGs`,
    },
    ...batch.stock_rows.map(r => ({
      label:   r.product_status.toUpperCase(),
      sachets: r.total_no_of_sachets,
      detail:  `${r.total_no_of_cartons.toLocaleString()} ( ${r.pack_size_short_name} × ${r.packs_per_carton} = ${r.total_no_of_packs.toLocaleString()} )`,
    })),
  ];

  const total = batch.total_sachets || 1;

  useEffect(() => {
    setCountVal(0);
    setProgressWidths(stages.map(() => 0));

    const steps = 60;
    const inc   = batch.total_sachets / steps;
    let cur     = 0;

    const t = setTimeout(() => {
      const interval = setInterval(() => {
        cur += inc;
        if (cur >= batch.total_sachets) {
          setCountVal(batch.total_sachets);
          clearInterval(interval);
        } else {
          setCountVal(Math.floor(cur));
        }
      }, 1000 / steps);

      setTimeout(() => {
        setProgressWidths(stages.map(s => (s.sachets / total) * 100));
      }, 300);

      return () => clearInterval(interval);
    }, delay + 200);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.batch_no, batch.total_sachets]);

  return (
    <div className="mt-2">
      {/* Product subtitle */}
      <div className="flex items-center gap-2 mb-3">
        {batch.product_image_icon ? (
          <img
            src={batch.product_image_icon}
            alt={batch.product_shortname}
            className="w-6 h-6 rounded object-cover"
          />
        ) : (
          <Package className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{batch.product_shortname}</span>
          {" "}({batch.batch_no})
        </span>
      </div>

      {/* Large total counter */}
      <div className="text-center mb-3">
        <p className="text-3xl font-bold text-foreground">{fmtK(countVal)}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          Total Sachets in Stock
        </p>
      </div>

      {/* Segmented progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden flex mb-4">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className={cn(STAGE_COLORS[i % STAGE_COLORS.length], "transition-all duration-1000 ease-out")}
            style={{ width: `${progressWidths[i] ?? 0}%` }}
          />
        ))}
      </div>

      {/* Stage grid */}
      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage, i) => (
          <div
            key={stage.label}
            className="flex items-start gap-2 animate-fade-in-up"
            style={{ animationDelay: `${delay + 200 + i * 100}ms` }}
          >
            <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0", STAGE_COLORS[i % STAGE_COLORS.length])} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {stage.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {fmtK(stage.sachets)}
              </p>
              <p className="text-xs text-muted-foreground">{stage.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockByStage({ delay = 0 }: { delay?: number }) {
  const [batches, setBatches]               = useState<BatchData[]>([]);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>("");
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stock-by-stage")
      .then(r => r.json())
      .then((data: BatchData[] | { error: string }) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => a.batch_no.localeCompare(b.batch_no));
          setBatches(sorted);
          if (sorted.length > 0) setSelectedBatchNo(sorted[0].batch_no);
        } else {
          setError((data as { error: string }).error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load stock data"))
      .finally(() => setLoading(false));
  }, []);

  const selected = batches.find(b => b.batch_no === selectedBatchNo) ?? null;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border animate-pulse h-48" />
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-sm border border-destructive text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border text-sm text-muted-foreground">
        No stock in any stage.
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-xl p-4 shadow-sm border border-border card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header with dropdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
            Stock by Stage
          </h3>
        </div>

        <div className="relative">
          <select
            value={selectedBatchNo}
            onChange={e => setSelectedBatchNo(e.target.value)}
            className="appearance-none text-xs font-semibold text-foreground bg-muted border border-border rounded-md pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {batches.map(b => (
              <option key={b.batch_no} value={b.batch_no}>
                {b.product_shortname}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {selected && (
        <BatchCard key={selected.batch_no} batch={selected} delay={delay} />
      )}
    </div>
  );
}
