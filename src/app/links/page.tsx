"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import LinksTable from "@/components/LinksTable";
import LinkCreationDialog from "@/components/LinkCreationDialog";
import { useMockData } from "@/hooks/use-mock-data";

export default function LinksPage() {
  const { links, createLink } = useMockData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = links.filter(
    (l) =>
      l.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      l.originalUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your shortened URLs and smart routing rules
            </p>
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

        <LinksTable links={filtered} />

        <LinkCreationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreate={createLink}
        />
      </div>
    </DashboardLayout>
  );
}
