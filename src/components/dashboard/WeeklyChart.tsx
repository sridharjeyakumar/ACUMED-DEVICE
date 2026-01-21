import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { name: "Mon", produced: 280000, target: 350000 },
  { name: "Tue", produced: 320000, target: 380000 },
  { name: "Wed", produced: 298000, target: 384000 },
  { name: "Thu", produced: 270000, target: 360000 },
  { name: "Fri", produced: 310000, target: 370000 },
];

export function WeeklyChart({ delay = 0 }: { delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 animate-fade-in-up">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground capitalize">
                {entry.dataKey}:
              </span>
              <span className="font-medium text-foreground">
                {formatYAxis(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="bg-card rounded-xl p-6 shadow-sm border border-border card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          Weekly Production Trend
        </h3>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYAxis}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="produced"
              fill="hsl(var(--chart-produced))"
              radius={[4, 4, 0, 0]}
              animationBegin={delay}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  style={{
                    transformOrigin: "bottom",
                    animation: isVisible
                      ? `barGrow 0.8s ease-out ${index * 100}ms forwards`
                      : "none",
                  }}
                />
              ))}
            </Bar>
            <Bar
              dataKey="target"
              fill="hsl(var(--chart-target))"
              radius={[4, 4, 0, 0]}
              animationBegin={delay + 200}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-chart-produced" />
          <span className="text-sm text-muted-foreground">Produced</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-chart-target" />
          <span className="text-sm text-muted-foreground">Target</span>
        </div>
      </div>
    </div>
  );
}
