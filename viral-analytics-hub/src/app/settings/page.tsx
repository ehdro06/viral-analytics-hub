"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useUser } from "@/hooks/use-user";
import { Copy, KeyRound, Loader2, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useUser();
  const { keys, isLoading, createKey, isCreating, lastCreated, resetCreated } = useApiKeys();
  const [revealOpen, setRevealOpen] = useState(false);

  const handleCreateKey = async () => {
    try {
      await createKey();
      setRevealOpen(true);
    } catch {
      toast.error("Could not create API key");
    }
  };

  const copyKey = () => {
    if (lastCreated?.key) {
      navigator.clipboard.writeText(lastCreated.key);
      toast.success("API key copied");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Profile and API keys for scripts and integrations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Signed in via OAuth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{user?.name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{user?.email}</span>
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                API keys
              </CardTitle>
              <CardDescription>
                Use <code className="text-xs bg-muted px-1 py-0.5 rounded">X-API-Key</code> on
                redirect and analytics APIs. The full secret is shown only once at creation.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleCreateKey} disabled={isCreating} className="gap-2 shrink-0">
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              New key
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading keys…</p>
            ) : keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {keys.map((k) => (
                  <li key={k.id} className="px-4 py-3 text-sm flex justify-between gap-4">
                    <span className="font-mono text-xs truncate max-w-[70%]" title={k.prefix}>
                      {k.prefix.slice(0, 12)}…
                    </span>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={revealOpen}
        onOpenChange={(open) => {
          setRevealOpen(open);
          if (!open) resetCreated();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              {lastCreated?.message ??
                "Copy this key now. You will not be able to see the full secret again."}
            </DialogDescription>
          </DialogHeader>
          {lastCreated?.key && (
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono break-all">
              {lastCreated.key}
            </pre>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={copyKey} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button onClick={() => setRevealOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
