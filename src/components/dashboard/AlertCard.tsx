import { X, AlertTriangle, TrendingDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  urgency: string;
  icon?: "alert" | "trend" | "package";
  delay?: number;
  onDismiss?: () => void;
}

const icons = {
  alert: AlertTriangle,
  trend: TrendingDown,
  package: Package,
};

export function AlertCard({
  type,
  title,
  description,
  urgency,
  icon = "alert",
  delay = 0,
  onDismiss,
}: AlertCardProps) {
  const Icon = icons[icon];

  return (
    <div
      className={cn(
        "rounded-xl p-4 relative card-hover animate-fade-in-up",
        type === "critical" && "bg-alert-critical-bg",
        type === "warning" && "bg-alert-warning-bg",
        type === "info" && "bg-muted"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            type === "critical" && "bg-destructive/20",
            type === "warning" && "bg-warning/20",
            type === "info" && "bg-primary/20"
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              type === "critical" && "text-destructive",
              type === "warning" && "text-warning",
              type === "info" && "text-primary"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-semibold text-sm mb-1",
              type === "critical" && "text-alert-critical-text",
              type === "warning" && "text-alert-warning-text",
              type === "info" && "text-foreground"
            )}
          >
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {description}
          </p>
          <span
            className={cn(
              "text-xs font-semibold uppercase",
              type === "critical" && "text-alert-critical-text",
              type === "warning" && "text-alert-warning-text",
              type === "info" && "text-primary"
            )}
          >
            {urgency}
          </span>
        </div>
      </div>
    </div>
  );
}
