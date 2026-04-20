"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { AlertCard } from "./AlertCard";

interface AlertItem {
  type: "critical" | "warning";
  title: string;
  description: string;
  icon: "alert" | "package";
}

export function ActiveAlerts({ delay = 0 }: { delay?: number }) {
  const [alerts, setAlerts]   = useState<AlertItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/active-alerts")
      .then(r => r.json())
      .then((data: AlertItem[] | { error: string }) => {
        if (Array.isArray(data)) {
          setAlerts(data);
        } else {
          setError((data as { error: string }).error ?? "Failed to load");
        }
      })
      .catch(() => setError("Failed to load alerts"))
      .finally(() => setLoading(false));
  }, []);

  const visible = alerts.filter((_, i) => !dismissed.has(i));

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

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Active Alerts
        </h3>
        {visible.length > 0 && (
          <span className="ml-auto text-xs font-semibold bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
            {visible.length}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active alerts.</p>
      ) : (
        <div className={`space-y-3 pr-1 ${visible.length > 4 ? "overflow-y-auto max-h-[400px]" : ""}`}>
          {alerts.map((alert, index) =>
            dismissed.has(index) ? null : (
              <AlertCard
                key={index}
                type={alert.type}
                title={alert.title}
                description={alert.description}
                urgency=""
                icon={alert.icon}
                delay={delay + 100 + index * 150}
                onDismiss={() => setDismissed(prev => new Set(prev).add(index))}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
