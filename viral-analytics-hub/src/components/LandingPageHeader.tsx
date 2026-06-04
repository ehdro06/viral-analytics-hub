'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogIn, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/hooks/use-auth-store';

export function LandingPageHeader() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const isLoading = !isHydrated;

  return (
    <header className="border-b border-slate-800 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">ViralLink</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {!isLoading && isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700">
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
