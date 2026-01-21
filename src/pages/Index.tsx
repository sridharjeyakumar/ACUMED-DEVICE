import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ProductionCard } from "@/components/dashboard/ProductionCard";
import { StockByStage } from "@/components/dashboard/StockByStage";
import { ActiveAlerts } from "@/components/dashboard/ActiveAlerts";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { RawMaterialsStock } from "@/components/dashboard/RawMaterialsStock";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto ml-64">
        <Header onRefresh={handleRefresh} />
        
        <div className="p-6" key={refreshKey}>
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ProductionCard delay={0} />
            <StockByStage delay={150} />
            <ActiveAlerts delay={300} />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WeeklyChart delay={450} />
            </div>
            <RawMaterialsStock delay={600} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
