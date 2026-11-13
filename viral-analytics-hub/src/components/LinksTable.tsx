import { LinkItem } from "@/lib/types";
import { shortLinkHost, shortLinkUrl } from "@/lib/short-link";
import { formatDate, formatDateTime } from "@/lib/format";
import { CalendarClock, Copy, MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import StatusLabel from "@/components/StatusLabel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LinksTableProps {
  links: LinkItem[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onTogglePause?: (link: LinkItem) => void;
  onEditExpiry?: (link: LinkItem) => void;
}

/** "https://www.example.com/a/very/long/path?x=1" -> "example.com/a/very…path?x=1" (start and end both survive). */
export function truncateMiddle(url: string, max = 52): string {
  const s = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (s.length <= max) return s;
  const tail = Math.floor(max / 3);
  return `${s.slice(0, max - tail - 1)}…${s.slice(-tail)}`;
}

const iconButton =
  "pressable inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground";

function Actions({ link, onCopy, onDelete, onTogglePause, onEditExpiry }: {
  link: LinkItem;
  onCopy: () => void;
} & Omit<LinksTableProps, "links" | "isLoading">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Actions for ${link.shortCode}`} className={iconButton}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy short link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTogglePause?.(link)}>
          {link.paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {link.paused ? "Resume link" : "Pause link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditExpiry?.(link)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          {link.expiresAt ? "Change expiry" : "Set expiry"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(link.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Status({ link }: { link: LinkItem }) {
  return (
    <div>
      <StatusLabel status={link.status} />
      {link.expiresAt && link.status !== "expired" && (
        <p className="text-meta text-muted-foreground">until {formatDateTime(link.expiresAt)}</p>
      )}
    </div>
  );
}

export default function LinksTable({ links, isLoading = false, onDelete, onTogglePause, onEditExpiry }: LinksTableProps) {
  const copyLink = (code: string) => {
    navigator.clipboard
      .writeText(shortLinkUrl(code))
      .then(() => toast.success("Short link copied"))
      .catch(() => toast.error("Couldn't copy. Your browser blocked clipboard access."));
  };

  if (isLoading) {
    return (
      <p className="rounded-lg border p-10 text-center text-sm text-muted-foreground" aria-busy="true">
        Loading links…
      </p>
    );
  }

  if (links.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="text-sm font-medium text-foreground">No links yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create a short link to start counting clicks.</p>
      </div>
    );
  }

  const handlers = { onDelete, onTogglePause, onEditExpiry };
  const Code = ({ link }: { link: LinkItem }) =>
    link.pending ? (
      <span className="text-sm text-muted-foreground">Creating…</span>
    ) : (
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-sm font-medium text-primary">{link.shortCode}</span>
        <button
          type="button"
          onClick={() => copyLink(link.shortCode)}
          aria-label={`Copy short link ${link.shortCode}`}
          className={iconButton}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </span>
    );

  return (
    <div>
      <p className="mb-2 text-meta text-muted-foreground">
        Short links open at <span className="font-mono text-foreground">{shortLinkHost()}/</span>
        <span className="font-mono text-primary">code</span>
      </p>

      <div className="overflow-hidden rounded-lg border bg-surface">
        {/* Wide screens: table */}
        <table className="hidden w-full text-sm md:table">
          <thead className="bg-muted/60">
            <tr className="border-b text-left text-meta text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium">Code</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Destination</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Clicks</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Created</th>
              <th scope="col" className="w-12 px-2 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className={`border-b last:border-0 ${link.pending ? "opacity-60" : ""}`}>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Code link={link} />
                </td>
                <td className="max-w-0 px-4 py-2.5 lg:w-[38%]">
                  <span className="block truncate text-foreground" title={link.originalUrl}>
                    {truncateMiddle(link.originalUrl)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">{!link.pending && <Status link={link} />}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{link.totalClicks.toLocaleString("en-US")}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">{formatDate(link.createdAt)}</td>
                <td className="px-2 py-2.5 text-right">
                  {!link.pending && <Actions link={link} onCopy={() => copyLink(link.shortCode)} {...handlers} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Narrow screens: stacked rows, same information in the same order */}
        <ul className="divide-y md:hidden">
          {links.map((link) => (
            <li key={link.id} className={`px-4 py-3 ${link.pending ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <Code link={link} />
                {!link.pending && <Actions link={link} onCopy={() => copyLink(link.shortCode)} {...handlers} />}
              </div>
              <p className="mt-1 truncate text-sm text-foreground" title={link.originalUrl}>
                {truncateMiddle(link.originalUrl, 40)}
              </p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                {!link.pending && <Status link={link} />}
                <p className="text-meta text-muted-foreground">
                  <span className="tabular-nums text-foreground">{link.totalClicks.toLocaleString("en-US")}</span> clicks ·{" "}
                  {formatDate(link.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
