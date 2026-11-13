import Image from "next/image";
import dashboardLight from "../../../public/product/dashboard-light.png";
import dashboardDark from "../../../public/product/dashboard-dark.png";

/**
 * The real dashboard (demo data), in a plain browser frame. Two captures: the one matching the current theme is
 * shown. Not decorative: it shows what you get after signing in.
 */
export default function ProductShot() {
  return (
    <figure className="overflow-hidden rounded-lg border bg-surface shadow-md dark:shadow-none">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
        <span aria-hidden className="h-2 w-2 rounded-full bg-input" />
        <span className="truncate rounded bg-surface px-2 py-0.5 font-mono text-[12px] leading-4 text-muted-foreground">
          vilnk.vercel.app/dashboard
        </span>
      </div>
      <Image
        src={dashboardLight}
        alt="The ViralLink dashboard: clicks in the last minute, an hourly chart for 48 hours, totals, top referrers and top countries."
        className="block h-auto w-full dark:hidden"
        sizes="(min-width: 1024px) 560px, 100vw"
        priority
      />
      <Image
        src={dashboardDark}
        alt="The ViralLink dashboard: clicks in the last minute, an hourly chart for 48 hours, totals, top referrers and top countries."
        className="hidden h-auto w-full dark:block"
        sizes="(min-width: 1024px) 560px, 100vw"
        priority
      />
      <figcaption className="sr-only">Dashboard with demo data</figcaption>
    </figure>
  );
}
