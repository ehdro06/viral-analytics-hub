"use client";

import { ReactNode, useState, ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/links", label: "Links", icon: Link2 },
];

function NavItem({ path, label, icon: Icon, active, onClick }: {
  path: string;
  label: string;
  icon: ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={path} onClick={onClick} className="block">
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname(); // Missing hook call added

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) return null; // Or return a splash screen/loader while redirecting

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
              active={pathname === item.path}
            />
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <NavItem
            path="/settings"
            label="Settings"
            icon={Settings}
            active={pathname === "/settings"}
          />
          <div className="mt-3 mx-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>IPs anonymized (GDPR)</span>
            {user && (
                 <div className="flex items-center gap-2 ml-2">
                    <span className="font-bold">{user.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={logout}><LogOut className="h-3 w-3"/></Button>
                 </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">ViralLink</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border lg:hidden"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-border">
                <span className="font-bold text-base tracking-tight text-foreground">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavItem
                    key={item.path}
                    {...item}
                    active={pathname === item.path}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
                <div className="pt-3 mt-3 border-t border-border">
                  <NavItem
                    path="/settings"
                    label="Settings"
                    icon={Settings}
                    active={pathname === "/settings"}
                    onClick={() => setMobileOpen(false)}
                  />
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
