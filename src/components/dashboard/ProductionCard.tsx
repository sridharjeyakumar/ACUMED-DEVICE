import { useEffect, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LineData {
  name: string;
  value: number;
  color: string;
}

const lines: LineData[] = [
  { name: "Line 1", value: 196900, color: "bg-success" },
  { name: "Line 2", value: 141900, color: "bg-primary" },
];

export function ProductionCard({ delay = 0 }: { delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [rejectedValue, setRejectedValue] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const totalValue = 338800;
  const target = 384000;
  const rejected = 2500;
  const percentage = Math.round((totalValue / target) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate main counter
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

      // Animate rejected counter
      const rejIncrement = rejected / steps;
      let rejCurrent = 0;
      const rejInterval = setInterval(() => {
        rejCurrent += rejIncrement;
        if (rejCurrent >= rejected) {
          setRejectedValue(rejected);
          clearInterval(rejInterval);
        } else {
          setRejectedValue(Math.floor(rejCurrent));
        }
      }, duration / steps);

      // Animate progress bar
      setTimeout(() => {
        setProgressWidth(percentage);
      }, 300);

      return () => {
        clearInterval(interval);
        clearInterval(rejInterval);
      };
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, percentage]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div
      className="bg-card rounded-xl p-4 shadow-sm border border-border card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
            Today's Production
          </h3>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded bg-success/10 text-success">
          {percentage}% OF TARGET
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-foreground">
          {formatNumber(displayValue)}
        </span>
        <span className="text-muted-foreground">/ {formatNumber(target)}</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Lines */}
      <div className="flex gap-8 mb-3">
        {lines.map((line, index) => (
          <div
            key={line.name}
            className="animate-fade-in-up"
            style={{ animationDelay: `${delay + 300 + index * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("w-2 h-2 rounded-full", line.color)} />
              <span className="text-sm text-muted-foreground">{line.name}</span>
            </div>
            <p className="text-xl font-semibold text-foreground">
              {formatNumber(line.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Rejected */}
      <div
        className="flex items-center gap-2 text-destructive animate-fade-in-up"
        style={{ animationDelay: `${delay + 500}ms` }}
      >
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">REJECTED</span>
        <span className="text-lg font-semibold ml-auto">
          {formatNumber(rejectedValue)}
        </span>
      </div>
    </div>
  );
}
