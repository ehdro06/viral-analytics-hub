// Public base URL of the redirect service (what people actually click).
// Local dev: the redirect service itself. In production: your short domain.
const BASE = (process.env.NEXT_PUBLIC_SHORT_LINK_BASE_URL ?? "http://localhost:8081").replace(/\/+$/, "");

/** Full URL that is copied to the clipboard. */
export function shortLinkUrl(code: string): string {
  return `${BASE}/${code}`;
}

/** Compact label shown in the UI, e.g. "localhost:8081/aB3dEf". */
export function shortLinkLabel(code: string): string {
  try {
    return `${new URL(BASE).host}/${code}`;
  } catch {
    return `${BASE}/${code}`;
  }
}
