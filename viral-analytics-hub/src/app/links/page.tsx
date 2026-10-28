"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import LinksTable from "@/components/LinksTable";
import LinkCreationDialog from "@/components/LinkCreationDialog";
import LinkExpiryDialog from "@/components/LinkExpiryDialog";
import { LinkItem } from "@/lib/types";
import { useLinks } from "@/hooks/use-links";

const messageOf = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export default function LinksPage() {
  const { links, isLoading, createLink, deleteLink, updateLinkStatus } = useLinks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expiryLink, setExpiryLink] = useState<LinkItem | null>(null);
  const [search, setSearch] = useState("");

  const filtered = links.filter(
    (l) =>
      l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (url: string) => {
    try {
      await createLink(url);
      toast.success("Short link created");
    } catch (err) {
      toast.error(messageOf(err, "Failed to create link"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLink(id);
      toast.success("Link deleted");
    } catch (err) {
      toast.error(messageOf(err, "Failed to delete link"));
    }
  };

  const handleTogglePause = async (link: LinkItem) => {
    try {
      await updateLinkStatus({ id: link.id, paused: !link.paused, expiresAt: link.expiresAt });
      toast.success(link.paused ? "Link resumed" : "Link paused");
    } catch (err) {
      toast.error(messageOf(err, "Failed to update link"));
    }
  };

  const handleSaveExpiry = async (link: LinkItem, expiresAt: string | null) => {
    try {
      await updateLinkStatus({ id: link.id, paused: link.paused, expiresAt });
      toast.success(expiresAt ? "Expiry saved" : "Expiry removed");
    } catch (err) {
      toast.error(messageOf(err, "Failed to update link"));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Links</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your shortened URLs</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="pl-9 bg-secondary border-border"
          />
        </div>

        <LinksTable
          links={filtered}
          isLoading={isLoading}
          onDelete={handleDelete}
          onTogglePause={handleTogglePause}
          onEditExpiry={setExpiryLink}
        />

        <LinkExpiryDialog link={expiryLink} onClose={() => setExpiryLink(null)} onSave={handleSaveExpiry} />

        <LinkCreationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreate}
        />
      </div>
    </DashboardLayout>
  );
}
