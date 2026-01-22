import { Search, Bell, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onRefresh?: () => void;
}

export function Header({ onRefresh }: HeaderProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-4">
        {/* Search */}
        <div className="relative flex-1 md:w-96 min-w-0 animate-fade-in-up">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-7 sm:pl-10 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>

        {/* Demo Role */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm animate-fade-in-up animate-delay-100 whitespace-nowrap shrink-0">
          <span className="text-muted-foreground">Demo Role:</span>
          <button className="flex items-center gap-0.5 sm:gap-1 font-medium text-foreground hover:text-primary transition-colors text-xs sm:text-sm">
            <span className="hidden sm:inline">Super Admin</span>
            <span className="sm:hidden">Admin</span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Notification and Profile - at the rightmost side */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 animate-fade-in-up animate-delay-100 shrink-0">
          <button className="relative p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3 h-3 sm:w-4 sm:h-4 bg-destructive text-destructive-foreground text-[10px] sm:text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-foreground flex items-center justify-center text-[10px] sm:text-xs font-medium text-background">
            RK
          </div>
        </div>
      </div>

      {/* Title Bar */}
      <div className="flex items-center justify-between mt-6">
        <div className="animate-fade-in-up animate-delay-200">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Rajesh Kumar. {formattedDate}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          className="animate-fade-in-up animate-delay-300 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    </header>
  );
}
