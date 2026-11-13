'use client';

import Link from 'next/link';
import { Activity, CalendarClock, KeyRound, ShieldCheck, type LucideIcon } from 'lucide-react';
import { UrlExpander } from '@/components/UrlExpander';
import { LandingPageHeader } from '@/components/LandingPageHeader';
import { Button } from '@/components/ui/button';

const FACTS = [
  { value: '1,000 / s', label: 'redirects in a local k6 load test, p95 under 2\u00a0ms, no clicks lost' },
  { value: '12 months', label: 'click data is kept, then deleted; visitor IPs are anonymised first' },
  { value: 'Free', label: 'while in beta, with a Google or GitHub sign-in' },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Activity,
    title: 'See clicks as they happen',
    text: 'The dashboard shows the last minute, an hourly chart for two days, and which sites and countries clicks come from.',
  },
  {
    icon: CalendarClock,
    title: 'Pause or expire a link',
    text: 'A paused or expired link shows a short "no longer active" page instead of redirecting. Resume it any time.',
  },
  {
    icon: ShieldCheck,
    title: 'Unsafe links are refused',
    text: 'Every destination is checked with Google Safe Browsing before a short link is created.',
  },
  {
    icon: KeyRound,
    title: 'Use it from your own code',
    text: 'Create an API key in Settings and send it in the X-API-Key header to create links and read click data.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingPageHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-5xl">
              Short links with click analytics
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Shorten a link, share it, and see who clicks: when, from which site, from which country. The redirect
              answers right away; counting happens in the background.
            </p>
          </div>

          <div className="mt-10">
            <UrlExpander />
          </div>

          <dl className="mt-10 grid gap-6 border-t pt-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.value}>
                <dt className="text-metric text-foreground">{f.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="features-title" className="border-t bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 id="features-title" className="text-2xl font-semibold tracking-tight">
              What you get after signing in
            </h2>
            <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/login">Sign in to create links</Link>
              </Button>
              <p className="text-sm text-muted-foreground">No password: Google or GitHub. Free while in beta.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 ViralLink · Short links with click analytics</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of service</Link>
            <a href="mailto:ideal3339@gmail.com" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
