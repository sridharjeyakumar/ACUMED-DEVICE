import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  suffix?: string;
  target?: number;
  targetLabel?: string;
  progress?: number;
  badge?: {
    label: string;
    variant: "success" | "warning" | "destructive";
  };
  children?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StatCard({
  icon,
  title,
  value,
  suffix = "",
  target,
  targetLabel,
  progress,
  badge,
  children,
  className,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animate counter
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      // Animate progress bar
      if (progress !== undefined) {
        setTimeout(() => {
          setProgressWidth(progress);
        }, 200);
      }

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, progress, delay]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 shadow-sm border border-border card-hover animate-fade-in-up",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-primary">{icon}</div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {badge && (
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium rounded",
              badge.variant === "success" && "bg-success/10 text-success",
              badge.variant === "warning" && "bg-warning/10 text-warning",
              badge.variant === "destructive" && "bg-destructive/10 text-destructive"
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-foreground animate-count-up">
          {formatNumber(displayValue)}
          {suffix}
        </span>
        {target && (
          <span className="text-muted-foreground">
            / {formatNumber(target)}
            {targetLabel && ` ${targetLabel}`}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      )}

      {children}
    </div>
  );
}
