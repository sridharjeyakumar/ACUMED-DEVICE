import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface DaysOfStockProps {
    delay?: number;
}

export const DaysOfStock = ({ delay = 0 }: DaysOfStockProps) => {
    const stockData = [
        { name: "Fabric", days: 8, status: "good" },
        { name: "Lamination", days: 3, status: "warning" },
        { name: "Sachet 24s", days: 15, status: "good" },
        { name: "Sachet 12s", days: 18, status: "good" },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "good":
                return "bg-green-50 border-green-200";
            case "warning":
                return "bg-red-50 border-red-200";
            default:
                return "bg-muted/30 border-border";
        }
    };

    const getTextColor = (status: string) => {
        switch (status) {
            case "good":
                return "text-green-600";
            case "warning":
                return "text-red-600";
            default:
                return "text-foreground";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay / 1000 }}
        >
            <Card className="p-6 bg-card border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Days of Stock</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {stockData.map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: (delay + index * 100) / 1000 }}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getStatusColor(
                                item.status
                            )}`}
                        >
                            <p className="text-sm text-muted-foreground mb-2">{item.name}</p>
                            <div className="flex items-baseline gap-1">
                                <p className={`text-3xl font-bold ${getTextColor(item.status)}`}>
                                    {item.days}
                                </p>
                                <span className="text-sm text-muted-foreground">days</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
};
