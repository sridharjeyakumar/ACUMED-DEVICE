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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ icon: LayoutDashboard, label: "Dashboard", active: true }],
  },
  {
    title: "CONFIGURATION",
    items: [
      { icon: Building2, label: "Company Master" },
      { icon: Users, label: "Role Master" },
      { icon: Key, label: "Role wise Menu Access" },
      { icon: CheckCircle2, label: "Product Status Master" },
      { icon: XCircle, label: "Product Rejection Type Master" },
      { icon: Package, label: "Material Status Master" },
      { icon: Layers, label: "Material Rejection Type Master" },
    ],
  },
  {
    title: "MASTER",
    items: [
      { icon: Package, label: "Product Master" },
      { icon: Layers, label: "Material Master" },
      { icon: Factory, label: "Production Capacity" },
      { icon: Box, label: "Pack Size Master" },
      { icon: Truck, label: "Carton Type Master" },
      { icon: Archive, label: "Carton Capacity Master" },
      { icon: FileText, label: "Product BOM" },
      { icon: List, label: "Packing BOM" },
    ],
  },
];

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(["CONFIGURATION", "MASTER"]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">$</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">ACUMED DEVICES</h1>
            <p className="text-xs text-sidebar-muted">UNIT 01 PRODUCTION</p>
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
                    <a
                      href="#"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        item.active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </a>
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
  );
}
