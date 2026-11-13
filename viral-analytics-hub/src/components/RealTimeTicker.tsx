interface RealTimeTickerProps {
  clicksLastMinute: number;
  peakClicksPerMinute: number;
}

const VIRAL_THRESHOLD = 300; // clicks per minute

/**
 * The number people come to the dashboard for. Static "Live" marker (the data refreshes every 10 seconds;
 * nothing pulses or counts up), plus one line of context against today's peak.
 */
export default function RealTimeTicker({ clicksLastMinute, peakClicksPerMinute }: RealTimeTickerProps) {
  const isViral = clicksLastMinute > VIRAL_THRESHOLD;

  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        Clicks in the last minute
        <span className="inline-flex items-center gap-1.5 text-meta text-foreground">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-status-live" />
          Live
        </span>
      </p>
      <p className="mt-2 text-metric-xl tabular-nums text-foreground" aria-live="polite">
        {clicksLastMinute.toLocaleString("en-US")}
      </p>
      <p className="mt-2 text-meta text-muted-foreground">
        {isViral ? (
          <span className="font-medium text-foreground">Over {VIRAL_THRESHOLD} a minute: this link is going viral.</span>
        ) : (
          <>
            Peak in the last 24 hours:{" "}
            <span className="tabular-nums text-foreground">{peakClicksPerMinute.toLocaleString("en-US")}</span> a minute
          </>
        )}
      </p>
    </div>
  );
}
