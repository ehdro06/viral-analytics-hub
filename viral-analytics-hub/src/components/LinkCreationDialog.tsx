import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LinkCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (url: string) => void;
}

/** "example.com/page" -> "https://example.com/page"; anything that already has a scheme is left alone. */
const withScheme = (raw: string) => {
  const url = raw.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

export default function LinkCreationDialog({ open, onClose, onCreate }: LinkCreationDialogProps) {
  const [url, setUrl] = useState("");

  const handleCreate = () => {
    if (!url.trim()) return;
    onCreate(withScheme(url));
    setUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a short link</DialogTitle>
          <DialogDescription>
            Paste the page you want to share. It is checked against Google Safe Browsing first.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="destination-url">Destination URL</Label>
            <Input
              id="destination-url"
              inputMode="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/launch-post"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Create link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
