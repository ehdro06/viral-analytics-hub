// The UI is English-only, so dates use a fixed locale instead of the browser's (which mixed in e.g. Korean month
// names). Times are still shown in the viewer's own time zone.
const LOCALE = "en-US";

/** "Oct 29, 2026" */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "numeric" });

/** "Oct 31, 06:39 AM" */
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** "Oct 29, 3 PM" (chart axis) */
export const formatHourLabel = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, { month: "short", day: "numeric", hour: "numeric" });
