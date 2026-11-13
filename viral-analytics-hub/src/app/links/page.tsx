"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Links"
          description="Create, pause and expire short links. Click counts update every 10 seconds."
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus />
              Create link
            </Button>
          }
        />

        <div className="relative max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search links by code or destination"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or destination"
            className="pl-9"
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

        <LinkCreationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
      </div>
    </DashboardLayout>
  );
}
