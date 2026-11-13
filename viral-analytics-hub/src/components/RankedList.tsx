import Link from "next/link";
import { EmptyChart } from "@/components/DataState";

export interface RankedRow {
  key: string;
  label: string;
  /** Optional secondary text, e.g. the country code. */
  hint?: string;
  count: number;
}

/**
 * A ranked table: rank, name, a single-hue bar scaled to the top row, count and share. Used for referrers and
 * countries. A real <table>, so it reads correctly with a screen reader and keeps numbers aligned.
 */
export default function RankedList({
  title,
  nameHeader,
  rows,
  limit,
  moreHref,
}: {
  title: string;
  nameHeader: string;
  rows: RankedRow[];
  limit?: number;
  moreHref?: string;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <section aria-labelledby={`${title}-title`}>
      <div className="flex items-baseline justify-between">
        <h2 id={`${title}-title`} className="text-section-title text-foreground">
          {title}
        </h2>
        {moreHref && rows.length > shown.length && (
          <Link href={moreHref} className="text-meta text-primary hover:underline underline-offset-4">
            All {rows.length}
          </Link>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyChart />
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b text-meta text-muted-foreground">
              <th scope="col" className="w-7 pb-2 text-left font-normal">
                <span className="sr-only">Rank</span>#
              </th>
              <th scope="col" className="pb-2 text-left font-normal">
                {nameHeader}
              </th>
              <th scope="col" className="hidden w-[28%] pb-2 font-normal sm:table-cell">
                <span className="sr-only">Share bar</span>
              </th>
              <th scope="col" className="w-16 pb-2 text-right font-normal">
                Clicks
              </th>
              <th scope="col" className="w-14 pb-2 text-right font-normal">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const share = total === 0 ? 0 : (r.count / total) * 100;
              return (
                <tr key={r.key} className="border-b last:border-0">
                  <td className="py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="max-w-0 truncate py-2.5 pr-3 text-foreground">
                    {r.label}
                    {r.hint && <span className="ml-1.5 text-meta text-muted-foreground">{r.hint}</span>}
                  </td>
                  <td aria-hidden className="hidden py-2.5 pr-4 sm:table-cell">
                    <div className="h-1.5 rounded-sm bg-muted">
                      <div className="h-full rounded-sm bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
                    </div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-foreground">{r.count.toLocaleString("en-US")}</td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">{share.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
