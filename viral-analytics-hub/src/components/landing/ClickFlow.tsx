const STEPS = [
  { title: "Someone clicks", body: "A visitor opens your short link.", tech: "GET /aB3dEf → 302" },
  { title: "Redirect answers", body: "The destination comes from the cache. The visitor is on their way in about 2 ms.", tech: "Spring Boot · Redis" },
  { title: "Click is queued", body: "The click goes onto a queue. Counting it never slows the redirect down.", tech: "Redis Streams" },
  { title: "Saved in batches", body: "Analytics stores clicks in batches and confirms each one only after it is saved: none get lost.", tech: "Spring Boot · PostgreSQL" },
  { title: "On your dashboard", body: "Totals, the hourly chart, referrers and countries refresh every 10 seconds.", tech: "Next.js" },
];

/**
 * What happens to one click, as a flat diagram: numbered steps joined by a line (horizontal on wide screens,
 * vertical on phones). An ordered list, so it reads as a sequence without the picture.
 */
export default function ClickFlow() {
  return (
    <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
      {/* the connecting line */}
      <span aria-hidden className="absolute bottom-3 left-[11px] top-3 w-px bg-border lg:bottom-auto lg:left-3 lg:right-3 lg:top-[11px] lg:h-px lg:w-auto" />
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative grid grid-cols-[24px_1fr] gap-3 lg:block">
          <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full border bg-background text-meta font-medium tabular-nums text-primary">
            {i + 1}
          </span>
          <div className="lg:mt-4">
            <h3 className="font-medium text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            <p className="mt-2 font-mono text-[12px] leading-4 text-muted-foreground">{s.tech}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
