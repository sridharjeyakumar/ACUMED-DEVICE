import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import { motion } from "framer-motion";

interface PackagingMaterialsProps {
  delay?: number;
}

export const PackagingMaterials = ({ delay = 0 }: PackagingMaterialsProps) => {
  const materials = [
    { name: "Sachet 24s", count: 450, status: "good" },
    { name: "Sachet 12s", count: 320, status: "good" },
    { name: "Ster. Carton", count: "1K", status: "good" },
    { name: "Shipper Carton", count: 850, status: "good" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <Card className="p-6 bg-card border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Packaging Materials</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {materials.map((material, index) => (
            <motion.div
              key={material.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: (delay + index * 100) / 1000 }}
              className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{material.name}</p>
                  <p className="text-2xl font-bold text-foreground">{material.count}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
