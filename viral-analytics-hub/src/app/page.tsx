'use client';

import { UrlExpander } from '@/components/UrlExpander';
import { LandingPageHeader } from '@/components/LandingPageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  BarChart3, 
  Globe2, 
  Link2, 
  Zap, 
  ShieldCheck, 
  Lock,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30">
      <LandingPageHeader />

      {/* Hero / Tool Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />
          
          <UrlExpander />

          <div className="mt-16 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <p className="text-sm font-semibold text-blue-400 mb-4 tracking-wider uppercase">Beyond simple redirects</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 max-w-2xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Turn your links into powerful marketing assets
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mb-8">
              ViralLink gives you complete control over your links. Shorten, track, and analyze every click in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow"></div>
                <Link href="/login" className="relative block">
                  <Button size="lg" className="relative h-12 px-8 text-lg bg-black hover:bg-slate-900 border border-slate-800 text-white">
                    Start Shortening for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-slate-900/50 py-24 border-y border-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={BarChart3}
                title="Real-time Analytics"
                description="Monitor clicks as they happen. Track location, device type, and referral sources instantly."
              />
              <FeatureCard 
                icon={Globe2}
                title="Global Reach"
                description="Our edge network ensures your links load instantly from anywhere in the world."
              />
              <FeatureCard 
                icon={ShieldCheck}
                title="Safety First"
                description="Built-in malware scanning and phishing protection keeps your audience safe."
              />
              <FeatureCard 
                icon={Link2}
                title="Custom Aliases"
                description="Create branded links that build trust and increase click-through rates."
              />
               <FeatureCard 
                icon={Zap}
                title="High Performance"
                description="Optimized redirect engine handling millions of requests with sub-millisecond latency."
              />
              <FeatureCard 
                icon={Lock}
                title="Enterprise Security"
                description="SSO, audit logs, and advanced access controls for teams."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-50">Ready to take control?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of marketers and developers using ViralLink to manage their links.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-100">ViralLink</h3>
            <p className="text-sm text-slate-400">
              The modern link management platform for growth teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-100">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">API</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-100">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-100">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © 2026 ViralLink Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-bold text-xl text-slate-100">{title}</h3>
        <p className="text-slate-400 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
