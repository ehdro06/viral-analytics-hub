import { describe, it, expect } from "vitest";
import { truncateMiddle } from "@/components/LinksTable";

describe("truncateMiddle", () => {
  it("drops the scheme and www", () => {
    expect(truncateMiddle("https://www.example.com/page")).toBe("example.com/page");
  });

  it("leaves short URLs whole", () => {
    expect(truncateMiddle("http://a.io/x", 20)).toBe("a.io/x");
  });

  it("keeps the start and the end of long URLs", () => {
    const out = truncateMiddle("https://example-store.com/black-friday-2026?utm_source=newsletter", 40);
    expect(out.length).toBe(40);
    expect(out.startsWith("example-store.com/")).toBe(true);
    expect(out.endsWith("newsletter")).toBe(true);
    expect(out).toContain("…");
  });
});
