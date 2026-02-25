'use client';

import { useState } from 'react';
import { ArrowRight, ShieldCheck, ShieldAlert, Loader2, Link as LinkIcon, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Hop {
  url: string;
  status: number;
  location?: string;
  duration?: number;
}

interface ExpandResult {
  finalUrl: string;
  hops: Hop[];
  safe: boolean;
  message?: string;
}

export function UrlExpander() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpandResult | null>(null);
  const [error, setError] = useState('');

  const handleExpand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Direct call to the proxy configured in next.config.ts which forwards to 8081
      const res = await fetch(`/api/v1/expand?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        throw new Error('Failed to expand URL');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Could not expand this link. It might be invalid or unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent pb-2">
          Reveal where links <br className="hidden sm:block" /> really go.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Unshorten URLs, trace redirects, and analyze link safety before you click. 
          Powered by our real-time analytics engine.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
        <CardContent className="pt-6">
          <form onSubmit={handleExpand} className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1 group">
              <LinkIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <Input 
                placeholder="Paste a shortened URL (e.g. bit.ly/xyz)..." 
                className="pl-10 h-12 text-lg bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500/50 transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button size="lg" type="submit" disabled={loading} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.02]">
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Expand & Scan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium animate-in fade-in duration-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className={`border-l-4 border-slate-800 bg-slate-900/40 backdrop-blur-sm ${result.safe ? 'border-l-emerald-500 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]' : 'border-l-red-500 shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)]'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <CardTitle className="flex items-center gap-3 text-slate-100">
                    Final Destination
                    {result.safe ? 
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Safe
                      </Badge> : 
                      <Badge variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Suspicious
                      </Badge>
                    }
                  </CardTitle>
                  <CardDescription className="mt-3 font-mono break-all text-base text-blue-400 bg-slate-950/50 p-3 rounded-md border border-slate-800/50">
                    {result.finalUrl}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-slate-800 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
                <History className="h-5 w-5 text-slate-500" /> Redirect Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {result.hops.map((hop, i) => (
                  <div key={i} className="relative flex items-start gap-4 group">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-medium text-slate-400 shadow-sm group-hover:border-slate-600 transition-colors">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-1 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={
                                hop.status >= 300 && hop.status < 400 ? 'border-orange-500/20 bg-orange-500/10 text-orange-400' :
                                hop.status === 200 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400'
                            }>
                                {hop.status}
                            </Badge>
                            <span className="font-mono text-sm text-slate-300 break-all">{hop.url}</span>
                        </div>
                        {hop.location && (
                             <div className="flex items-center gap-2 text-sm text-slate-500 pl-2 mt-2">
                                <ArrowRight className="h-3 w-3" />
                                <span className="text-xs">Redirects to:</span>
                                <span className="font-mono text-xs text-slate-400">{hop.location}</span>
                             </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
