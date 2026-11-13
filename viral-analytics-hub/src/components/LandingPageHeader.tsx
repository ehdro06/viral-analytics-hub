'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Wordmark from '@/components/Wordmark';
import { useUser } from '@/hooks/use-user';

export function LandingPageHeader() {
  const { user, isLoading, logout } = useUser();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Account" className="flex items-center gap-2">
          {!isLoading && user ? (
            <>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign out
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </>
          ) : (
            // One entry point: signing in with Google or GitHub also creates the account on first use
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
