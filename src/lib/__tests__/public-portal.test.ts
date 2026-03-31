import { describe, expect, it, vi, afterEach } from "vitest";
import {
  formatTripDate,
  generateTripPublicSlug,
  getPortalDefaults,
  getPublicSubtitle,
  getPublicTitle,
  getTripTimeLabel,
  sortTripsNewestFirst,
} from "@/lib/public-portal";

describe("public portal helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates a stable public slug", () => {
    expect(
      generateTripPublicSlug("Celtic Quest IV", "2026-07-04", "morning")
    ).toBe("2026-07-04-celtic-quest-iv-morning");
  });

  it("formats titles and subtitles with fallbacks", () => {
    expect(
      getPublicTitle({
        boat: "Celtic Grace",
        date: "2026-07-04",
        trip_time: "afternoon",
        public_title: null,
      })
    ).toBe("Celtic Grace Afternoon Trip");

    expect(
      getPublicSubtitle({
        boat: "Celtic Grace",
        date: "2026-07-04",
        trip_time: "afternoon",
        public_subtitle: null,
      })
    ).toContain("Celtic Grace");
  });

  it("sorts afternoon ahead of morning on the same day", () => {
    const trips = sortTripsNewestFirst([
      { date: "2026-07-04", trip_time: "morning" as const },
      { date: "2026-07-04", trip_time: "afternoon" as const },
      { date: "2026-07-03", trip_time: "afternoon" as const },
    ]);

    expect(trips[0]).toEqual({ date: "2026-07-04", trip_time: "afternoon" });
    expect(trips[1]).toEqual({ date: "2026-07-04", trip_time: "morning" });
  });

  it("reads config-driven CTA defaults", () => {
    vi.stubEnv("PHOTO_PORTAL_DEFAULT_REVIEW_URL", "https://example.com/review");
    vi.stubEnv("PHOTO_PORTAL_DEFAULT_TAG_US_TEXT", "Tag us");
    vi.stubEnv("PHOTO_PORTAL_DEFAULT_TAG_US_URL", "https://example.com/tag");
    vi.stubEnv("PHOTO_PORTAL_DEFAULT_BOOK_AGAIN_URL", "https://example.com/book");

    expect(getPortalDefaults()).toEqual({
      reviewUrl: "https://example.com/review",
      tagUsText: "Tag us",
      tagUsUrl: "https://example.com/tag",
      bookAgainUrl: "https://example.com/book",
    });
  });

  it("returns readable labels", () => {
    expect(getTripTimeLabel("morning")).toBe("Morning Trip");
    expect(formatTripDate("2026-07-04")).toContain("2026");
  });
});
