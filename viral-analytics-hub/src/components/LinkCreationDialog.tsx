import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  if (!open) return null;

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
          aria-label="Create link"
          className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Create Link</h2>
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
              handleCreate();
            }}
          >
            <div>
              <label
                htmlFor="destination-url"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block"
              >
                Destination URL
              </label>
              <Input
                id="destination-url"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/my-awesome-page"
                className="bg-secondary border-border focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full" disabled={!url.trim()}>
              Generate Short Link
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
