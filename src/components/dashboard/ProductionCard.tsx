"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MachineRow {
  machine_id: string;
  start_time: string | null;
  produced_qty_kgs: number;
  produced_sachets: number;
}

interface BatchData {
  batch_no: string;
  product_id: string;
  product_name: string;
  start_date: string | null;
  planned_no_of_working_days: number | null;
  planned_total_no_of_sachets: number | null;
  planned_daily_sachets: number | null;
  produced_qty_kgs: number;
  produced_sachets: number;
  rejected_qty_kgs: number;
  batch_produced_sachets: number;
  batch_pct: number;
  machines: MachineRow[];
}

const MACHINE_COLORS = ["bg-success", "bg-primary", "bg-warning", "bg-destructive"];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toFixed(1);
}

function BatchCard({ batch, delay }: { batch: BatchData; delay: number }) {
  const [dailyWidth, setDailyWidth] = useState(0);

  const dailyPct =
    batch.planned_daily_sachets && batch.planned_daily_sachets > 0
      ? Math.min(Math.round((batch.produced_sachets / batch.planned_daily_sachets) * 100), 100)
      : 0;

  useEffect(() => {
    setDailyWidth(0);
    const t = setTimeout(() => setDailyWidth(dailyPct), delay + 300);
    return () => clearTimeout(t);
  }, [dailyPct, delay, batch.batch_no]);

  return (
    <div className="mt-3">
      {/* Batch info row */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 mb-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Batch : <span className="font-semibold text-foreground">{batch.batch_no}</span>
          &nbsp;&nbsp; Started on : <span className="font-semibold text-foreground">{formatDate(batch.start_date)}</span>
        </span>
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-success/10 text-success whitespace-nowrap">
          {dailyPct}% OF TARGET
        </span>
      </div>

      {/* Large produced / planned numbers */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-foreground">
          {fmtK(batch.produced_sachets)}
        </span>
        <span className="text-muted-foreground text-sm">
          / {fmtK(batch.planned_daily_sachets ?? 0)}
        </span>
      </div>

      {/* KGs sub-line */}
      <div className="text-xs text-muted-foreground mb-3">
        {batch.produced_qty_kgs.toFixed(3)} KGs produced today
      </div>

      {/* Daily progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${dailyWidth}%` }}
        />
      </div>

      {/* Machine lines */}
      {batch.machines.length > 0 ? (
        <div className="flex gap-6 mb-3 flex-wrap">
          {batch.machines.map((m, i) => (
            <div key={m.machine_id}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={cn("w-2 h-2 rounded-full", MACHINE_COLORS[i % MACHINE_COLORS.length])} />
                <span className="text-xs text-muted-foreground">{m.machine_id}</span>
                <span className="text-xs text-muted-foreground">{formatTime(m.start_time)}</span>
              </div>
              <div className="flex gap-3 pl-3.5">
                <span className="text-base font-semibold text-foreground">{fmtK(m.produced_sachets)}</span>
                <span className="text-xs text-muted-foreground self-end mb-0.5">{m.produced_qty_kgs.toFixed(2)} KGs</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic mb-3">No production recorded today</div>
      )}

      {/* Rejected */}
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Rejected</span>
        <span className="text-base font-semibold ml-auto">{fmtK(batch.rejected_qty_kgs)}</span>
      </div>
    </div>
  );
}

export function ProductionCard({ delay = 0 }: { delay?: number }) {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [selectedBatchNo, setSelectedBatchNo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/production-batches")
      .then((r) => r.json())
      .then((data: BatchData[] | { error: string }) => {
        if (Array.isArray(data)) {
          // Sort oldest start_date first → default to oldest
          const sorted = [...data].sort((a, b) => {
            if (!a.start_date) return 1;
            if (!b.start_date) return -1;
            return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          });
          setBatches(sorted);
          if (sorted.length > 0) setSelectedBatchNo(sorted[0].batch_no);
        } else {
          setError(data.error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load production data"))
      .finally(() => setLoading(false));
  }, []);

  const selected = batches.find((b) => b.batch_no === selectedBatchNo) ?? null;

  if (loading) {
    return <div className="bg-card rounded-xl p-4 shadow-sm border border-border animate-pulse h-36" />;
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
        No active batches in production.
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
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
            Today&apos;s Production
          </h3>
        </div>

        {/* Product dropdown */}
        <div className="relative">
          <select
            value={selectedBatchNo}
            onChange={(e) => setSelectedBatchNo(e.target.value)}
            className="appearance-none text-xs font-semibold text-foreground bg-muted border border-border rounded-md pl-2 pr-6 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {batches.map((b) => (
              <option key={b.batch_no} value={b.batch_no}>
                {b.product_name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Batch card body */}
      {selected && <BatchCard key={selected.batch_no} batch={selected} delay={delay} />}
    </div>
  );
}
