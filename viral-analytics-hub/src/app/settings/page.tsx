"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useDeleteAccount } from "@/hooks/use-delete-account";
import { useUser } from "@/hooks/use-user";
import { Copy, Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10" aria-labelledby={`s-${title}`}>
      <div>
        <h2 id={`s-${title}`} className="text-section-title text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

/** Segmented control. Rendered after mount: the stored theme is only known in the browser. */
function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <div role="radiogroup" aria-label="Colour theme" className="inline-flex rounded-md border p-0.5">
      {THEMES.map((t) => {
        const selected = mounted && (theme ?? "system") === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(t.value)}
            className={`pressable rounded px-3 py-1.5 text-sm ${
              selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout } = useUser();
  const { keys, isLoading, createKey, isCreating, lastCreated, resetCreated } = useApiKeys();
  const [revealOpen, setRevealOpen] = useState(false);
  const deleteAccount = useDeleteAccount();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">
        <PageHeader title="Settings" description="Your profile, appearance, API keys and account." />

        <div className="divide-y border-y">
          <Section title="Profile" description="From your Google or GitHub sign-in.">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{user?.name}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all text-foreground">{user?.email}</dd>
            </dl>
            <Button variant="outline" size="sm" className="mt-4" onClick={logout}>
              <LogOut />
              Sign out
            </Button>
          </Section>

          <Section title="Appearance" description="Follow your device, or pick one.">
            <ThemeChoice />
          </Section>

          <Section
            title="API keys"
            description={
              <>
                For scripts and integrations: send the key in the <code className="rounded bg-muted px-1 py-0.5 text-[0.8125rem]">X-API-Key</code>{" "}
                header to the links and analytics APIs. The full key is shown once, when you create it.
              </>
            }
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading keys…" : keys.length === 0 ? "No API keys yet." : `${keys.length} ${keys.length === 1 ? "key" : "keys"}`}
              </p>
              <Button size="sm" onClick={handleCreateKey} disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
                Create key
              </Button>
            </div>
            {keys.length > 0 && (
              <ul className="mt-3 divide-y rounded-lg border">
                {keys.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <span className="truncate font-mono text-foreground" title={k.prefix}>
                      {k.prefix.slice(0, 12)}…
                    </span>
                    <span className="shrink-0 text-meta text-muted-foreground">
                      {k.createdAt ? `Created ${formatDate(k.createdAt)}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Delete account"
            description={
              <>
                Deletes your account, your short links (they stop working), your API keys and the click data of your
                links. This cannot be undone. See the{" "}
                <Link href="/privacy" className="text-foreground underline underline-offset-4">
                  privacy policy
                </Link>
                .
              </>
            }
          >
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete account
            </Button>
          </Section>
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (deleteAccount.isPending) return;
          setDeleteOpen(open);
          if (!open) {
            setDeleteConfirm("");
            deleteAccount.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your account, links, API keys and click data will be deleted immediately and cannot be recovered. Type{" "}
              <strong>DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
          />
          {deleteAccount.error && <p className="text-sm text-destructive">{deleteAccount.error.message}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteAccount.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "DELETE" || deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              {deleteAccount.isPending && <Loader2 className="animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono text-sm">
              {lastCreated.key}
            </pre>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={copyKey}>
              <Copy />
              Copy key
            </Button>
            <Button onClick={() => setRevealOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
