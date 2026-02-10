import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Link2, ArrowRight, Smartphone, Globe, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartRule } from "@/hooks/use-mock-data";

interface LinkCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (url: string, rules: SmartRule[]) => void;
}

export default function LinkCreationDialog({ open, onClose, onCreate }: LinkCreationDialogProps) {
  const [url, setUrl] = useState("");
  const [rules, setRules] = useState<SmartRule[]>([]);
  const [showRules, setShowRules] = useState(false);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: String(Date.now()), condition: "device", value: "mobile", targetUrl: "" },
    ]);
    setShowRules(true);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, field: keyof SmartRule, value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleCreate = () => {
    if (!url.trim()) return;
    onCreate(url, rules);
    setUrl("");
    setRules([]);
    setShowRules(false);
    onClose();
  };

  const conditionIcons = {
    device: Smartphone,
    country: Globe,
    os: Monitor,
    browser: Monitor,
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
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Destination URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/my-awesome-page"
                className="bg-secondary border-border focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Smart Routing Rules
                </label>
                <button
                  onClick={addRule}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  <Plus className="w-3 h-3" />
                  Add Rule
                </button>
              </div>

              {showRules && rules.length > 0 && (
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const Icon = conditionIcons[rule.condition];
                    return (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
                      >
                        <Icon className="w-4 h-4 text-primary mt-2 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <select
                              value={rule.condition}
                              onChange={(e) =>
                                updateRule(rule.id, "condition", e.target.value)
                              }
                              className="bg-secondary border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                            >
                              <option value="device">Device</option>
                              <option value="country">Country</option>
                              <option value="os">OS</option>
                              <option value="browser">Browser</option>
                            </select>
                            <Input
                              value={rule.value}
                              onChange={(e) =>
                                updateRule(rule.id, "value", e.target.value)
                              }
                              placeholder="e.g. mobile, DE"
                              className="text-xs h-8 bg-secondary border-border"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <Input
                              value={rule.targetUrl}
                              onChange={(e) =>
                                updateRule(rule.id, "targetUrl", e.target.value)
                              }
                              placeholder="Redirect URL"
                              className="text-xs h-8 bg-secondary border-border"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {rules.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No rules yet. Links will redirect all users to the destination URL.
                </p>
              )}
            </div>

            <Button onClick={handleCreate} className="w-full" disabled={!url.trim()}>
              Generate Short Link
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
