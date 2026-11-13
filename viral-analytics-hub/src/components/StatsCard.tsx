/** One total in the dashboard's summary row: a label and a number, nothing else. */
export default function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-metric tabular-nums text-foreground">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}
