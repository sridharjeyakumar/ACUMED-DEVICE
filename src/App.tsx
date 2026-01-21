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
          <Route path="/monthly-production-target" element={<MonthlyProductionTarget />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
