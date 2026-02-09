import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Link2,
  LayoutDashboard,
  Zap,
  Settings,
  Menu,
  X,
  Shield,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/links", label: "Links", icon: Link2 },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

function NavItem({ path, label, icon: Icon, active, onClick }: {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link to={path} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
        )}
      </div>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-sidebar shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">ViralLink</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              active={location.pathname === item.path}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <NavItem
            path="/settings"
            label="Settings"
            icon={Settings}
            active={location.pathname === "/settings"}
          />
          <div className="mt-3 mx-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>IPs anonymized (GDPR)</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm text-foreground">ViralLink</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden absolute top-14 left-0 right-0 z-50 bg-sidebar border-b border-border p-3 space-y-1"
            >
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.path}
                  {...item}
                  active={location.pathname === item.path}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
