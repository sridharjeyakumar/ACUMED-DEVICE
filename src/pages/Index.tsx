import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { ProductionCard } from "@/components/dashboard/ProductionCard";
import { StockByStage } from "@/components/dashboard/StockByStage";
import { ActiveAlerts } from "@/components/dashboard/ActiveAlerts";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { RawMaterialsStock } from "@/components/dashboard/RawMaterialsStock";
import { PackagingMaterials } from "@/components/dashboard/PackagingMaterials";
import { DaysOfStock } from "@/components/dashboard/DaysOfStock";

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
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Production & Chart */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProductionCard delay={0} />
                <StockByStage delay={150} />
              </div>
              <WeeklyChart delay={450} />

              {/* Packaging Materials and Days of Stock below the chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PackagingMaterials delay={750} />
                <DaysOfStock delay={900} />
              </div>
            </div>

            {/* Right Column - Alerts & Raw Materials */}
            <div className="space-y-6">
              <ActiveAlerts delay={300} />
              <RawMaterialsStock delay={600} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
