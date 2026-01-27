'use client';

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
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto lg:ml-64 w-full">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden sticky top-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-semibold text-sm">ACUMED DEVICES</h1>
          </div>
        </div>

        <Header onRefresh={handleRefresh} />

        <div className="p-4 sm:p-6" key={refreshKey}>
          {/* Main Grid Layout */}
          {/* Main Content Layout */}
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left Column - Production & Chart */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <ProductionCard delay={0} />
                  <StockByStage delay={150} />
                </div>
                <WeeklyChart delay={450} />
              </div>

              {/* Right Column - Alerts & Raw Materials */}
              <div className="space-y-4 sm:space-y-6">
                <ActiveAlerts delay={300} />
                <RawMaterialsStock delay={600} />
              </div>
            </div>

            {/* Bottom Row - Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PackagingMaterials delay={750} />
              <DaysOfStock delay={900} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


