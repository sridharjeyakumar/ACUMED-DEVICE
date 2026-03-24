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


