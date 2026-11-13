"use client";

import { ReactNode, useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, LayoutDashboard, Link2, LogOut, Menu, Settings } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Wordmark from "@/components/Wordmark";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/links", label: "Links", icon: Link2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

function NavItem({
  path,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  path: string;
  label: string;
  icon: ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150 ease-out",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      {label}
    </Link>
  );
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.path} {...item} active={pathname === item.path} onClick={onNavigate} />
      ))}
    </nav>
  );
}

function Account({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-2 border-t pt-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-meta text-muted-foreground">{email}</p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="pressable rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground" aria-busy="true">
        Loading your workspace…
      </div>
    );
  }

  if (!user) return null; // redirecting to /login

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r px-3 py-4 lg:flex">
        <div className="px-2.5 pb-6">
          <Wordmark />
        </div>
        <Navigation pathname={pathname} />
        <div className="mt-auto space-y-3">
          <p className="px-2.5 text-meta text-muted-foreground">Visitor IPs are anonymised before storage.</p>
          <Account name={user.name} email={user.email} onLogout={logout} />
        </div>
      </aside>

      {/* Mobile top bar + menu */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <Wordmark />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="pressable -mr-2 rounded-md p-2 text-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-4" aria-describedby={undefined}>
          <SheetTitle className="px-2.5 pb-4 text-base">Menu</SheetTitle>
          <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto">
            <Account name={user.name} email={user.email} onLogout={logout} />
          </div>
        </SheetContent>
      </Sheet>

      <main className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
