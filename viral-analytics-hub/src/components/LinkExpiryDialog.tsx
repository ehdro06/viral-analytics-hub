import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkItem } from "@/lib/types";

interface LinkExpiryDialogProps {
  link: LinkItem | null;
  onClose: () => void;
  /** New expiry as an ISO instant, or null to remove it. */
  onSave: (link: LinkItem, expiresAt: string | null) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DDTHH:mm" in local time, the format <input type="datetime-local"> uses. */
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const defaultExpiry = (link: LinkItem) =>
  link.expiresAt && new Date(link.expiresAt) > new Date()
    ? toLocalInput(new Date(link.expiresAt))
    : toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // a week from now

export default function LinkExpiryDialog({ link, onClose, onSave }: LinkExpiryDialogProps) {
  if (!link) return null;
  // Keyed by link: switching to another link starts from that link's expiry
  return <ExpiryForm key={link.id} link={link} onClose={onClose} onSave={onSave} />;
}

function ExpiryForm({ link, onClose, onSave }: { link: LinkItem } & Omit<LinkExpiryDialogProps, "link">) {
  const [value, setValue] = useState(() => defaultExpiry(link));
  const isFuture = value !== "" && new Date(value) > new Date();

  const save = () => {
    if (!isFuture) return;
    onSave(link, new Date(value).toISOString()); // local wall time -> UTC instant
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Set expiry"
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Link expiry</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <div>
              <label
                htmlFor="expires-at"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Stops working after
              </label>
              <Input
                id="expires-at"
                type="datetime-local"
                autoFocus
                value={value}
                min={toLocalInput(new Date())}
                onChange={(e) => setValue(e.target.value)}
                className="bg-secondary border-border focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                After this time, visitors see a &quot;no longer active&quot; page. Your local time zone.
              </p>
            </div>

            <div className="flex gap-2">
              {link.expiresAt && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onSave(link, null);
                    onClose();
                  }}
                >
                  Remove expiry
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={!isFuture}>
                Save
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
