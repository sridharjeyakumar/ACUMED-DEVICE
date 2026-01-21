import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageData {
  label: string;
  value: number;
  color: string;
}

const stages: StageData[] = [
  { label: "MANUFACTURED", value: 850000, color: "bg-primary" },
  { label: "QC PENDING", value: 125000, color: "bg-chart-target" },
  { label: "STERILIZATION", value: 280000, color: "bg-warning" },
  { label: "READY", value: 445000, color: "bg-success" },
];

export function StockByStage({ delay = 0 }: { delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [progressWidths, setProgressWidths] = useState<number[]>([0, 0, 0, 0]);
  const totalValue = 1700000;
  const total = stages.reduce((sum, s) => sum + s.value, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate counter
      const duration = 1000;
      const steps = 60;
      const increment = totalValue / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= totalValue) {
          setDisplayValue(totalValue);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      // Animate progress bars
      setTimeout(() => {
        const widths = stages.map((s) => (s.value / total) * 100);
        setProgressWidths(widths);
      }, 300);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, total]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return Math.floor(num / 1000) + "K";
    }
    return num.toString();
  };

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Stock by Stage
        </h3>
      </div>

      <div className="text-center mb-4">
        <span className="text-4xl font-bold text-foreground">
          {formatNumber(displayValue)}
        </span>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
          Total Pieces in Stock
        </p>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden flex mb-6">
        {stages.map((stage, index) => (
          <div
            key={stage.label}
            className={cn(stage.color, "transition-all duration-1000 ease-out")}
            style={{ width: `${progressWidths[index]}%` }}
          />
        ))}
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-2 gap-4">
        {stages.map((stage, index) => (
          <div
            key={stage.label}
            className="flex items-center gap-2 animate-fade-in-up"
            style={{ animationDelay: `${delay + 200 + index * 100}ms` }}
          >
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <div>
              <p className="text-xs text-muted-foreground uppercase">
                {stage.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(stage.value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
