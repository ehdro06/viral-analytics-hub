'use client';

import { useRef, useState } from 'react';
import { ArrowRight, ShieldCheck, ShieldAlert, Loader2, Link as LinkIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (res.status === 429) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? 'Too many lookups. Please wait a minute and try again.');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to expand URL');
      }
      const data = await res.json();
      setResult({
        finalUrl: data.finalUrl,
        hops: data.hops ?? [],
        safe: data.safe ?? true,
        message: data.message ?? data.note,
      });
    } catch {
      setError('Could not expand this link. It might be invalid or unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="expander-title" className="rounded-lg border bg-surface p-5 sm:p-6">
      <h2 id="expander-title" className="text-section-title text-foreground">
        Check where a short link goes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste any short link. We follow each redirect without opening the page, then check the destination with Google
        Safe Browsing.
      </p>

      <form onSubmit={handleExpand} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="expand-url" className="sr-only">
            Short link to check
          </label>
          <LinkIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="expand-url"
            ref={inputRef}
            inputMode="url"
            autoComplete="off"
            placeholder="bit.ly/3xYzAbc"
            className="h-11 pl-9 pr-10"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {url && (
            <button
              type="button"
              aria-label="Clear"
              onClick={() => {
                setUrl('');
                inputRef.current?.focus();
              }}
              className="pressable absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button size="lg" type="submit" disabled={loading} className="h-11">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Checking…' : 'Check link'}
        </Button>
      </form>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-destructive/40 px-3 py-2 text-sm text-foreground">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 space-y-6 border-t pt-5">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Final destination</h3>
                {result.safe ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    <ShieldCheck aria-hidden className="h-4 w-4 text-status-live" />
                    No known threats
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <ShieldAlert aria-hidden className="h-4 w-4 text-status-danger" />
                    Suspicious{result.message ? `: ${result.message}` : ''}
                  </span>
                )}
              </div>
              <p className="mt-2 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground">{result.finalUrl}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Redirect chain, {result.hops.length} {result.hops.length === 1 ? 'step' : 'steps'}
              </h3>
              <ol className="mt-3 space-y-3">
                {result.hops.map((hop, i) => (
                  <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
                    <span className="pt-0.5 text-meta tabular-nums text-muted-foreground">{i + 1}.</span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-mono text-meta text-muted-foreground">{hop.status}</span>
                        <span className="min-w-0 break-all font-mono text-sm text-foreground">{hop.url}</span>
                      </p>
                      {hop.location && (
                        <p className="mt-1 flex min-w-0 flex-col gap-0.5 text-meta text-muted-foreground sm:flex-row sm:gap-2">
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <ArrowRight aria-hidden className="h-3 w-3" />
                            Redirects to
                          </span>
                          <span className="min-w-0 break-all font-mono">{hop.location}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
