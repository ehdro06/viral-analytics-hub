/**
 * Code blocks are focusable (tabIndex) so keyboard users can scroll them sideways.
 * A real request against the public API and the response it returns. Colour is limited to the accent for the
 * parts you change (key, URL) and muted grey for punctuation; no syntax-highlighter rainbow.
 */
const k = "text-primary"; // parts you fill in
const m = "text-muted-foreground"; // punctuation and flags

export default function CodeExample() {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
      <figure className="min-w-0 overflow-hidden rounded-lg border bg-surface">
        <figcaption className="border-b px-4 py-2 text-meta text-muted-foreground">Request</figcaption>
        <pre tabIndex={0} aria-label="Example request" className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6 text-foreground">
          <code>
            curl <span className={m}>-X</span> POST https://vilnk.vercel.app/api/v1/links <span className={m}>\</span>
            {"\n  "}
            <span className={m}>-H</span> <span className={m}>&quot;</span>X-API-Key: <span className={k}>$VIRALLINK_API_KEY</span>
            <span className={m}>&quot;</span> <span className={m}>\</span>
            {"\n  "}
            <span className={m}>-H</span> <span className={m}>&quot;</span>Content-Type: application/json<span className={m}>&quot;</span>{" "}
            <span className={m}>\</span>
            {"\n  "}
            <span className={m}>-d</span> <span className={m}>&apos;{"{"}</span>&quot;longUrl&quot;: &quot;
            <span className={k}>https://example.com/launch</span>&quot;<span className={m}>{"}"}&apos;</span>
          </code>
        </pre>
      </figure>
      <figure className="min-w-0 overflow-hidden rounded-lg border bg-surface">
        <figcaption className="border-b px-4 py-2 text-meta text-muted-foreground">Response</figcaption>
        <pre tabIndex={0} aria-label="Example response" className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6 text-foreground">
          <code>
            <span className={m}>{"{"}</span>
            {"\n  "}&quot;shortCode&quot;<span className={m}>:</span> &quot;<span className={k}>aB3dEf</span>&quot;<span className={m}>,</span>
            {"\n  "}&quot;longUrl&quot;<span className={m}>:</span> &quot;https://example.com/launch&quot;
            {"\n"}
            <span className={m}>{"}"}</span>
          </code>
        </pre>
      </figure>
    </div>
  );
}
