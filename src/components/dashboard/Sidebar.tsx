'use client';

import { useState, useMemo, memo, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  CheckCircle2,
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
  Award,
  CalendarDays,
  CalendarOff,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    title: "MASTER",
    items: [
      { icon: Package, label: "Product Master", href: "/product-master" },
      { icon: Layers, label: "Material Master", href: "/material-master" },
      { icon: Ruler, label: "UOM Master", href: "/uom-master" },
      { icon: Factory, label: "Production Machinery Master", href: "/production-capacity" },
      { icon: Box, label: "Pack Size Master", href: "/pack-size-master" },
      { icon: Truck, label: "Carton Type Master", href: "/carton-type-master" },
      { icon: Archive, label: "Carton Capacity Master", href: "/carton-capacity-master" },
      { icon: FileText, label: "Product BOM", href: "/product-bom" },
      { icon: Trash2, label: "Collection Bin Master", href: "/collection-bin-master" },
      { icon: CheckCircle2, label: "COA Checklist Master", href: "/coa-checklist-master" },
      { icon: FileText, label: "COA Checklist Detail", href: "/coa-checklist-detail" },
      { icon: UserCircle, label: "Employee Master", href: "/employee-master" },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      { icon: Building2, label: "Company Master", href: "/company-master" },
      { icon: PackageOpen, label: "Product Category Master", href: "/product-category-master" },
      { icon: Layers, label: "Material Category Master", href: "/material-category-master" },
      { icon: CheckCircle2, label: "Product Status Master", href: "/product-status-master" },
      { icon: Package, label: "Material Status Master", href: "/material-status-master" },
      { icon: Factory, label: "Department Master", href: "/department-master" },
      { icon: Award, label: "Employee Grade Master", href: "/employee-grade-master" },
      { icon: CalendarDays, label: "Holidays Master", href: "/holidays-master" },
      { icon: CalendarOff, label: "Weekly Off Master", href: "/weekly-off-master" },
    ],
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
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = memo(function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const activeItemRef = useRef<HTMLLIElement>(null);
  
  // Find which section contains the active item and ensure it's expanded
  const getActiveSection = useCallback(() => {
    const normalizedPath = pathname?.replace(/\/$/, '') || '/';
    for (const section of navSections) {
      const hasActiveItem = section.items.some(item => {
        const normalizedHref = (item.href || '').replace(/\/$/, '');
        return normalizedHref === normalizedPath || (item.href === '/' && normalizedPath === '/');
      });
      if (hasActiveItem && section.title) {
        return section.title;
      }
    }
    return null;
  }, [pathname]);

  // Initialize expanded sections with the active section included
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSection = getActiveSection();
    const defaultSections = ["MASTER"];
    if (activeSection && !defaultSections.includes(activeSection)) {
      return [...defaultSections, activeSection];
    }
    return defaultSections;
  });

  // Ensure active section is expanded when pathname changes
  useEffect(() => {
    const activeSection = getActiveSection();
    if (activeSection && !expandedSections.includes(activeSection)) {
      setExpandedSections(prev => [...prev, activeSection]);
    }
  }, [pathname, getActiveSection, expandedSections]);

  // Scroll to active item when it becomes visible
  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      const nav = navRef.current;
      const activeItem = activeItemRef.current;
      const navRect = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Check if item is visible
      if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
        // Scroll to center the active item
        const scrollTop = activeItem.offsetTop - nav.offsetTop - (nav.clientHeight / 2) + (activeItem.clientHeight / 2);
        nav.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
        scrollPositionRef.current = nav.scrollTop;
      }
    }
  }, [pathname, expandedSections]);

  // Preserve scroll position on re-renders (but not when pathname changes)
  useEffect(() => {
    if (navRef.current && !activeItemRef.current) {
      navRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const handleScroll = useCallback(() => {
    if (navRef.current) {
      scrollPositionRef.current = navRef.current.scrollTop;
    }
  }, []);

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  // Memoize the active pathname to prevent unnecessary re-renders
  const activePathname = useMemo(() => {
    return pathname?.replace(/\/$/, '') || '/';
  }, [pathname]);

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
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Acumed Devices Logo" width={40} height={40} className="object-contain" />
            <div>
              <h1 className="font-semibold text-foreground text-sm">ACUMED DEVICES</h1>
              <p className="text-[10px] text-sidebar-muted leading-tight">Production & Inventory Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav ref={navRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-2">
              {section.title && (
                <button
                  onClick={() => toggleSection(section.title!)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-xs font-medium transition-colors",
                    expandedSections.includes(section.title)
                      ? "text-foreground font-bold"
                      : "text-sidebar-muted hover:text-foreground"
                  )}
                  suppressHydrationWarning
                >
                  {section.title}
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedSections.includes(section.title) ? "rotate-0" : "-rotate-90",
                      expandedSections.includes(section.title) ? "text-foreground" : "text-sidebar-muted"
                    )}
                  />
                </button>
              )}
              {(!section.title || expandedSections.includes(section.title)) && (
                <ul className="space-y-1 px-2">
                  {section.items.map((item, itemIndex) => {
                    const normalizedHref = (item.href || '').replace(/\/$/, '');
                    const isActive = activePathname === normalizedHref || (item.href === "/" && activePathname === "/");
                    const itemKey = `${section.title || 'root'}-${item.href || itemIndex}`;
                    return (
                      <li 
                        key={itemKey}
                        ref={isActive ? activeItemRef : null}
                      >
                        <Link
                          href={item.href || "#"}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                          )}
                          prefetch={true}
                        >
                          <item.icon className={cn(
                            "w-5 h-5 flex-shrink-0",
                            isActive && "text-sidebar-accent-foreground"
                          )} />
                          <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
            Settings
          </a>
          <div className="flex items-center gap-3 mt-4 px-3">
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
});
