import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Material {
  name: string;
  current: number;
  min: number;
  reorder: number;
  unit: string;
  status: "normal" | "low" | "critical";
}

const materials: Material[] = [
  {
    name: "Fabric Roll",
    current: 650,
    min: 500,
    reorder: 700,
    unit: "KG",
    status: "low",
  },
  {
    name: "Lamination Film",
    current: 180,
    min: 300,
    reorder: 400,
    unit: "KG",
    status: "critical",
  },
];

export function RawMaterialsStock({ delay = 0 }: { delay?: number }) {
  const [progressWidths, setProgressWidths] = useState<number[]>([0, 0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const widths = materials.map((m) => (m.current / m.reorder) * 100);
      setProgressWidths(widths);
    }, delay + 300);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wide">
          Raw Materials Stock
        </h3>
      </div>

      <div className="space-y-6">
        {materials.map((material, index) => (
          <div
            key={material.name}
            className="animate-fade-in-up"
            style={{ animationDelay: `${delay + 200 + index * 150}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {material.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {material.current} {material.unit}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold rounded uppercase",
                    material.status === "low" && "bg-warning/20 text-warning",
                    material.status === "critical" &&
                      "bg-destructive/20 text-destructive animate-pulse-subtle",
                    material.status === "normal" && "bg-success/20 text-success"
                  )}
                >
                  {material.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  material.status === "low" && "bg-warning",
                  material.status === "critical" && "bg-destructive",
                  material.status === "normal" && "bg-success"
                )}
                style={{ width: `${Math.min(progressWidths[index], 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {material.min}</span>
              <span>Reorder: {material.reorder}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
