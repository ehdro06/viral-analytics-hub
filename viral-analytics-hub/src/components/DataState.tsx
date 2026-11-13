import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shown while the first analytics response is on its way. Same shape as the loaded page. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading analytics">
      <Skeleton className="h-[320px] rounded-lg" />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}

/** Shown when the backend cannot be reached. Deliberately never falls back to made-up numbers. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 p-4" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load data</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Empty body used by the chart and table components. */
export function EmptyChart({ text = "No clicks yet. Share a link and they'll show up here." }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
