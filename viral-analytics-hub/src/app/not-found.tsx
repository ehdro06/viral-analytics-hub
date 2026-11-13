import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm">
        <p className="text-meta text-muted-foreground">Error 404</p>
        <h1 className="mt-1 text-page-title text-foreground">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The address may be mistyped, or the page was moved. If you followed a short link, it may have been deleted.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/">Go to the home page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
