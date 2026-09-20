import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shown while the first analytics response is on its way. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[106px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/** Shown when the backend cannot be reached. Deliberately never falls back to made-up numbers. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3" role="alert">
      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load data</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Empty card body used by the chart components. */
export function EmptyChart({ text = "No clicks yet. Share a link and they'll show up here." }: { text?: string }) {
  return <p className="text-sm text-muted-foreground py-8 text-center">{text}</p>;
}
