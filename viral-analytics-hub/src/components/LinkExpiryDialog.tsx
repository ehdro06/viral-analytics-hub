import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {/* Keyed by link: switching to another link starts from that link's expiry */}
        {link && <ExpiryForm key={link.id} link={link} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
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
    <>
      <DialogHeader>
        <DialogTitle>Link expiry</DialogTitle>
        <DialogDescription>
          After this time, visitors to <span className="font-mono text-foreground">{link.shortCode}</span> see a
          &quot;no longer active&quot; page.
        </DialogDescription>
      </DialogHeader>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="expires-at">Stops working after</Label>
          <Input
            id="expires-at"
            type="datetime-local"
            autoFocus
            value={value}
            min={toLocalInput(new Date())}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-meta text-muted-foreground">In your local time zone.</p>
        </div>
        <DialogFooter>
          {link.expiresAt && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onSave(link, null);
                onClose();
              }}
            >
              Remove expiry
            </Button>
          )}
          <Button type="submit" disabled={!isFuture}>
            Save expiry
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
