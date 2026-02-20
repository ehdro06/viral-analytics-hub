import { LinkItem } from "@/hooks/use-mock-data";
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
  onDelete?: (id: string) => void;
}

export default function LinksTable({ links, onDelete }: LinksTableProps) {
  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`http://localhost:8081/${code}`); // Use local for now
    toast.success("Copied to clipboard!");
  };

  const statusColors = {
    active: "bg-success/15 text-success",
    paused: "bg-viral/15 text-viral",
    expired: "bg-muted text-muted-foreground",
  };

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
              <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Status
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Rules
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {links.map((link, i) => (
              <motion.tr
                key={link.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary font-medium">
                      vrl.ink/{link.shortCode}
                    </span>
                    <button
                      onClick={() => copyLink(link.shortCode)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 max-w-xs">
                    <span className="text-sm text-muted-foreground truncate">
                      {link.originalUrl}
                    </span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="font-mono text-sm text-foreground">
                    {link.totalClicks.toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[link.status]}`}
                  >
                    {link.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-xs text-muted-foreground font-mono">
                    {link.rules.length}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-secondary text-muted-foreground outline-none">
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
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-medium">
                  vrl.ink/{link.shortCode}
                </span>
                <button
                  onClick={() => copyLink(link.shortCode)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[link.status]}`}
              >
                {link.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{link.originalUrl}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {link.rules.length} rule{link.rules.length !== 1 ? "s" : ""}
              </span>
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
