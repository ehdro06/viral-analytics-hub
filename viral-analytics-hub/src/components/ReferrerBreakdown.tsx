import { ReferrerData } from "@/lib/types";
import RankedList from "@/components/RankedList";

export default function ReferrerBreakdown({ data, limit, moreHref }: { data: ReferrerData[]; limit?: number; moreHref?: string }) {
  return (
    <RankedList
      title="Top referrers"
      nameHeader="Source"
      limit={limit}
      moreHref={moreHref}
      rows={data.map((d) => ({ key: d.source, label: d.source === "direct" ? "Direct or unknown" : d.source, count: d.clicks }))}
    />
  );
}
