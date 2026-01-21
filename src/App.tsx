import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CompanyMaster from "./pages/CompanyMaster";
import ProductMaster from "./pages/ProductMaster";
import RoleMaster from "./pages/RoleMaster";
import MonthlyProductionTarget from "./pages/MonthlyProductionTarget";
import RoleWiseMenuAccess from "./pages/RoleWiseMenuAccess";
import ProductStatusMaster from "./pages/ProductStatusMaster";
import ProductRejectionTypeMaster from "./pages/ProductRejectionTypeMaster";
import MaterialStatusMaster from "./pages/MaterialStatusMaster";
import MaterialRejectionTypeMaster from "./pages/MaterialRejectionTypeMaster";
import DailyProductionRecord from "./pages/DailyProductionRecord";
import ProductionRejectedUpdate from "./pages/ProductionRejectedUpdate";
import ProductionUpdate from "./pages/ProductionUpdate";
import ProductMovement from "./pages/ProductMovement";
import MaterialMovement from "./pages/MaterialMovement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/company-master" element={<CompanyMaster />} />
          <Route path="/product-master" element={<ProductMaster />} />
          <Route path="/role-master" element={<RoleMaster />} />
          <Route path="/role-wise-menu-access" element={<RoleWiseMenuAccess />} />
          <Route path="/product-status-master" element={<ProductStatusMaster />} />
          <Route path="/product-rejection-type-master" element={<ProductRejectionTypeMaster />} />
          <Route path="/material-status-master" element={<MaterialStatusMaster />} />
          <Route path="/material-rejection-type-master" element={<MaterialRejectionTypeMaster />} />
          <Route path="/monthly-production-target" element={<MonthlyProductionTarget />} />
          <Route path="/daily-production-record" element={<DailyProductionRecord />} />
          <Route path="/production-rejected-update" element={<ProductionRejectedUpdate />} />
          <Route path="/production-update" element={<ProductionUpdate />} />
          <Route path="/product-movement" element={<ProductMovement />} />
          <Route path="/material-movement" element={<MaterialMovement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
