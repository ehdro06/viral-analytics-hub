'use client';

import { UrlExpander } from '@/components/UrlExpander';
import { LandingPageHeader } from '@/components/LandingPageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  BarChart3,
  Link2,
  ShieldCheck,
  ArrowRight,
  Workflow,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      <LandingPageHeader />

      <main className="flex-1">
        {/* 1 — Hero + live expander */}
        <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />
          <UrlExpander />
          <div className="mt-12 flex justify-center">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white gap-2">
                Sign in to shorten links <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* 2 — What works today (honest MVP) */}
        <section className="bg-slate-900/50 py-20 border-y border-slate-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">What&apos;s in the MVP</h2>
            <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
              A learning/portfolio stack — not production SaaS yet. These pieces are wired end-to-end locally.
            </p>
            <ul className="grid sm:grid-cols-2 gap-6 text-sm">
              <MvpItem icon={Link2} title="Short links" text="Create and list links per account (JWT or API key on redirect service)." />
              <MvpItem icon={BarChart3} title="Click analytics" text="Redirects publish events to Redis; analytics sponge writes Postgres; dashboard polls summary API." />
              <MvpItem icon={ShieldCheck} title="URL expander" text="Trace redirect chains on the landing page; basic safety flag (Safe Browsing when configured)." />
              <MvpItem icon={KeyRound} title="API keys" text="HMAC-signed keys from user service for automation — full secret shown once at creation." />
            </ul>
          </div>
        </section>

        {/* 3 — How it works */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
            <Workflow className="h-10 w-10 text-blue-400 mb-6" />
            <h2 className="text-2xl font-bold mb-6">How a click becomes a chart</h2>
            <ol className="text-left text-slate-400 space-y-4 w-full max-w-md">
              <li><span className="text-slate-200 font-medium">1.</span> Visitor hits redirect service → 302 to destination.</li>
              <li><span className="text-slate-200 font-medium">2.</span> Redirect publishes tenant-scoped event to Redis stream.</li>
              <li><span className="text-slate-200 font-medium">3.</span> Analytics sponge batches, persists, ACKs.</li>
              <li><span className="text-slate-200 font-medium">4.</span> Dashboard polls your summary (JWT), ~10s refresh.</li>
            </ol>
          </div>
        </section>

        {/* 4 — Safety / expander */}
        <section className="bg-slate-950 py-16 border-t border-slate-800">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-3">Check before you click</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Paste a short URL above to see hops and a safety hint. With <code className="text-xs bg-slate-800 px-1 rounded">SAFE_BROWSING_API_KEY</code>,
              redirect can call Google Safe Browsing; without it, results are best-effort from redirect resolution only.
            </p>
          </div>
        </section>

        {/* 5 — CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Try the dashboard</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Sign in with Google or GitHub (OAuth on user service). You&apos;ll get a JWT for the Next.js app to call redirect and analytics.
          </p>
          <Link href="/login">
            <Button size="lg" className="rounded-full px-8">
              Get started
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-sm text-slate-500">
        © 2026 ViralLink — monorepo demo (user · redirect · analytics · Next.js)
      </footer>
    </div>
  );
}

function MvpItem({ icon: Icon, title, text }: { icon: typeof Link2; title: string; text: string }) {
  return (
    <li className="flex gap-4 p-4 rounded-lg border border-slate-800 bg-slate-900/30">
      <Icon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{text}</p>
      </div>
    </li>
  );
}
