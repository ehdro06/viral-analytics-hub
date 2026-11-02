'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

export function LandingPageHeader() {
  const { user, isLoading, logout } = useUser();

  return (
    <header className="border-b border-slate-800 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ViralLink</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {!isLoading && user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
              <Link href="/dashboard">
                <Button size="sm" className="gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </>
          ) : (
            // One entry point: signing in with Google/GitHub also creates the account on first use
            <Link href="/login">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
