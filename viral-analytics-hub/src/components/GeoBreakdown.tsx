import { GeoDataPoint } from "@/lib/types";
import RankedList from "@/components/RankedList";

export default function GeoBreakdown({ data, limit, moreHref }: { data: GeoDataPoint[]; limit?: number; moreHref?: string }) {
  return (
    <RankedList
      title="Top countries"
      nameHeader="Country"
      limit={limit}
      moreHref={moreHref}
      rows={data.map((d) => ({ key: `${d.countryCode}-${d.country}`, label: d.country, hint: d.countryCode, count: d.count }))}
    />
  );
}
