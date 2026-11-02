import Link from "next/link";
import type { ReactNode } from "react";

/** Shared layout for the privacy policy and terms pages: plain, readable, no app chrome. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg hover:opacity-80 transition-opacity">
            ViralLink
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>
      <main
        className="max-w-3xl mx-auto px-4 py-10 text-sm leading-relaxed text-muted-foreground
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-base
          [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1
          [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline [&_table]:my-4 [&_table]:w-full
          [&_th]:text-left [&_th]:text-foreground [&_th]:font-medium [&_th]:border-b [&_th]:border-border [&_th]:py-2
          [&_th]:pr-3 [&_td]:align-top [&_td]:border-b [&_td]:border-border/50 [&_td]:py-2 [&_td]:pr-3"
      >
        <h1>{title}</h1>
        <p className="!mt-1 text-xs">Last updated: {updated}</p>
        {children}
      </main>
    </div>
  );
}
