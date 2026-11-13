import type { LinkStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT: Record<LinkStatus, string> = {
  active: "bg-status-live",
  paused: "bg-status-paused",
  expired: "bg-muted-foreground",
};

const TEXT: Record<LinkStatus, string> = {
  active: "Active",
  paused: "Paused",
  expired: "Expired",
};

/** Status as a word with a small dot. The colour is never the only signal. */
export default function StatusLabel({ status, className }: { status: LinkStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm text-foreground", className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {TEXT[status]}
    </span>
  );
}
