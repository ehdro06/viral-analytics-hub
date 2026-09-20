import { LinkItem } from "@/lib/types";
import { shortLinkLabel, shortLinkUrl } from "@/lib/short-link";
import { motion } from "framer-motion";
import { ExternalLink, Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LinksTableProps {
  links: LinkItem[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function LinksTable({ links, isLoading = false, onDelete }: LinksTableProps) {
  const copyLink = (code: string) => {
    navigator.clipboard
      .writeText(shortLinkUrl(code))
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Couldn't copy. Your browser blocked clipboard access."));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading links...
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">No links yet</p>
        <p className="text-sm text-muted-foreground mt-1">Create your first short link to start tracking clicks.</p>
      </div>
    );
  }

  const label = (link: LinkItem) =>
    link.pending ? "Creating..." : shortLinkLabel(link.shortCode);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Short Link
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Destination
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Clicks
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Created
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
              <motion.tr
                key={link.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: link.pending ? 0.6 : 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary font-medium">{label(link)}</span>
                    {!link.pending && (
                      <button
                        onClick={() => copyLink(link.shortCode)}
                        aria-label="Copy short link"
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 max-w-xs">
                    <span className="text-sm text-muted-foreground truncate">{link.originalUrl}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="font-mono text-sm text-foreground">
                    {link.totalClicks.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">
                  {formatDate(link.createdAt)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!link.pending && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Link actions"
                          className="p-1 rounded hover:bg-secondary text-muted-foreground outline-none"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyLink(link.shortCode)}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copy Link</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete?.(link.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-border">
        {links.map((link, i) => (
          <motion.div
            key={link.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: link.pending ? 0.6 : 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-medium">{label(link)}</span>
                {!link.pending && (
                  <button
                    onClick={() => copyLink(link.shortCode)}
                    aria-label="Copy short link"
                    className="p-1 rounded hover:bg-secondary text-muted-foreground"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
              {!link.pending && (
                <button
                  onClick={() => onDelete?.(link.id)}
                  aria-label="Delete link"
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{link.originalUrl}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{formatDate(link.createdAt)}</span>
              <span className="font-mono text-sm text-foreground font-medium">
                {link.totalClicks.toLocaleString()} clicks
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
