import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Factory,
  Box,
  Truck,
  Archive,
  FileText,
  List,
  Settings,
  ChevronDown,
  Trash2,
  Shield,
  ShieldCheck,
  UserCircle,
  Target,
  Upload,
  AlertCircle,
  FileBarChart,
  TrendingUp,
  PackageOpen,
  Menu as MenuIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  href?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ icon: LayoutDashboard, label: "Dashboard", active: true, href: "/" }],
  },
  {
    title: "SYSTEM",
    items: [
      { icon: MenuIcon, label: "Menu Master", href: "/menu-master" },
      { icon: Users, label: "Role Master", href: "/role-master" },
      { icon: Key, label: "Menu Access Master", href: "/menu-access-master" },
      { icon: UserCircle, label: "User Master", href: "/user-master" },
      { icon: Clock, label: "User Login History", href: "/user-login-history" },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      { icon: Building2, label: "Company Master", href: "/company-master" },
      { icon: Key, label: "Role wise Menu Access", href: "/role-wise-menu-access" },
      { icon: CheckCircle2, label: "Product Status Master", href: "/product-status-master" },
      { icon: XCircle, label: "Product Rejection Type Master", href: "/product-rejection-type-master" },
      { icon: Package, label: "Material Status Master", href: "/material-status-master" },
      { icon: Layers, label: "Material Rejection Type Master", href: "/material-rejection-type-master" },
    ],
  },
  {
    title: "MASTER",
    items: [
      { icon: Package, label: "Product Master", href: "/product-master" },
      { icon: Layers, label: "Material Master", href: "/material-master" },
      { icon: Factory, label: "Production Capacity", href: "/production-capacity" },
      { icon: Box, label: "Pack Size Master", href: "/pack-size-master" },
      { icon: Truck, label: "Carton Type Master", href: "/carton-type-master" },
      { icon: Archive, label: "Carton Capacity Master", href: "/carton-capacity-master" },
      { icon: FileText, label: "Product BOM", href: "/product-bom" },
      { icon: List, label: "Packing BOM", href: "/packing-bom" },
      { icon: Trash2, label: "Collection Bin Master", href: "/collection-bin-master" },
      { icon: ShieldCheck, label: "Product Status Master", href: "/product-status-master" },
      { icon: Shield, label: "Material Status Master", href: "/material-status-master" },
      { icon: UserCircle, label: "Employee Master", href: "/employee-master" },
    ],
  },
  {
    title: "TRANSACTION",
    items: [
      { icon: Target, label: "Monthly Production Target", href: "/monthly-production-target" },
      { icon: Upload, label: "Production Update", href: "/production-update" },
      { icon: AlertCircle, label: "Production Rejected Update", href: "/production-rejected-update" },
      { icon: FileBarChart, label: "Daily Production Record", href: "/daily-production-record" },
      { icon: TrendingUp, label: "Product movement", href: "/product-movement" },
      { icon: PackageOpen, label: "Material movement", href: "/material-movement" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["SYSTEM", "CONFIGURATION", "MASTER", "TRANSACTION"]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border animate-fade-in-up">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Acumed Devices Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-semibold text-foreground text-sm">ACUMED DEVICES</h1>
              <p className="text-[10px] text-sidebar-muted leading-tight">Production & Inventory Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-2">
              {section.title && (
                <button
                  onClick={() => toggleSection(section.title!)}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-sidebar-muted hover:text-foreground transition-colors"
                >
                  {section.title}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedSections.includes(section.title) ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}
              {(!section.title || expandedSections.includes(section.title)) && (
                <ul className="space-y-1 px-2">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="animate-slide-in-left"
                      style={{ animationDelay: `${itemIndex * 50}ms` }}
                    >
                      <Link
                        to={item.href || "#"}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          item.active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all duration-200 animate-fade-in-up"
          >
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <div className="flex items-center gap-3 mt-4 px-3 animate-fade-in-up animate-delay-100">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">
              RK
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Rajesh Kumar</p>
              <p className="text-xs text-sidebar-muted">SUPERADMIN</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
