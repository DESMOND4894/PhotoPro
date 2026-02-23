import { describe, it, expect } from "vitest";
import { getBoatSlug, formatTripLabel } from "@/lib/types";

describe("getBoatSlug", () => {
  it("converts Celtic Quest IV to slug", () => {
    expect(getBoatSlug("Celtic Quest IV")).toBe("celtic-quest-iv");
  });

  it("converts Celtic Grace to slug", () => {
    expect(getBoatSlug("Celtic Grace")).toBe("celtic-grace");
  });
});

describe("formatTripLabel", () => {
  it("formats a morning trip label", () => {
    const label = formatTripLabel("Celtic Quest IV", "morning", "2024-06-15");
    expect(label).toContain("Celtic Quest IV");
    expect(label).toContain("Morning");
    expect(label).toContain("Jun");
    expect(label).toContain("15");
  });

  it("formats an afternoon trip label", () => {
    const label = formatTripLabel("Celtic Grace", "afternoon", "2024-12-25");
    expect(label).toContain("Celtic Grace");
    expect(label).toContain("Afternoon");
    expect(label).toContain("Dec");
    expect(label).toContain("25");
  });
});
