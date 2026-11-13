import Link from "next/link";
import { Link2 } from "lucide-react";

/** Logo: a solid accent square with the link glyph, then the name. Links home. */
export default function Wordmark() {
  return (
    <Link href="/" aria-label="ViralLink home" className="inline-flex items-center gap-2 rounded-md text-foreground">
      <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
        <Link2 className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">ViralLink</span>
    </Link>
  );
}
