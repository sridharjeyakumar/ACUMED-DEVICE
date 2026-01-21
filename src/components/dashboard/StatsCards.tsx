import { Card } from "@/components/ui/card";
import { Factory, CheckCircle2, Gauge, TrendingUp } from "lucide-react";

interface StatsCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
    iconBg: string;
}

const StatCard = ({ icon: Icon, label, value, color, iconBg }: StatsCardProps) => (
    <Card className="flex-1 p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{label}</p>
                <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            </div>
        </div>
    </Card>
);

export const StatsCards = () => {
    const stats = [
        {
            icon: Factory,
            label: "Total Lines",
            value: "45",
            color: "text-white",
            iconBg: "bg-emerald-500",
        },
        {
            icon: CheckCircle2,
            label: "Active Lines",
            value: "42",
            color: "text-white",
            iconBg: "bg-blue-500",
        },
        {
            icon: Gauge,
            label: "Avg Utilization",
            value: "78.4%",
            color: "text-white",
            iconBg: "bg-violet-500",
        },
        {
            icon: TrendingUp,
            label: "Daily Capacity",
            value: "28.5K",
            color: "text-white",
            iconBg: "bg-amber-500",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
            ))}
        </div>
    );
};
