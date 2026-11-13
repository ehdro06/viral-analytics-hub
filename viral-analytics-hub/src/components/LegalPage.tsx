import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/Wordmark";

/** Shared layout for the privacy policy and terms pages: a readable measure, no app chrome. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Wordmark />
          <nav aria-label="Legal" className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </header>
      <main
        className="mx-auto max-w-3xl px-4 py-10 text-[15px] leading-7 text-foreground sm:px-6
          [&_h1]:text-page-title [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:text-section-title [&_p]:my-3
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4
          [&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left
          [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top
          [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:text-[0.875em]"
      >
        <h1>{title}</h1>
        <p className="!mt-1 text-meta text-muted-foreground">Last updated {updated}</p>
        <div className="mt-6 max-w-[68ch]">{children}</div>
      </main>
    </div>
  );
}
