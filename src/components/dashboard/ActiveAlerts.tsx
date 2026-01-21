import { Bell } from "lucide-react";
import { AlertCard } from "./AlertCard";

const alerts = [
  {
    type: "critical" as const,
    title: "Critical: Lamination Film Low",
    description:
      "Lamination Film Roll stock is critically low at 180 KG. Reorder immediately.",
    urgency: "3 DAYS UNTIL STOCKOUT",
    icon: "alert" as const,
  },
  {
    type: "warning" as const,
    title: "Reorder Alert: Fabric Roll",
    description:
      "Non-woven Fabric Roll approaching reorder level. Current: 650 KG. Reorder at: 700 KG.",
    urgency: "8 DAYS UNTIL STOCKOUT",
    icon: "package" as const,
  },
  {
    type: "warning" as const,
    title: "Production Target Variance",
    description:
      "January production is 12% below target. Current: 2.1M pieces. Target: 2.4M pieces.",
    urgency: "",
    icon: "trend" as const,
  },
];

export function ActiveAlerts({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Active Alerts
        </h3>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <AlertCard
            key={index}
            {...alert}
            delay={delay + 100 + index * 150}
          />
        ))}
      </div>
    </div>
  );
}
