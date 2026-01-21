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
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative w-96 animate-fade-in-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search data, reports, transactions..."
            className="pl-10 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 animate-fade-in-up animate-delay-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Demo Role:</span>
            <button className="flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors">
              Super Admin
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background">
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
