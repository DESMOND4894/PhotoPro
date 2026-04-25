export const BRAND_SIGNOFF =
  "Sailing daily, private charters arranged. Call us anytime at 631-928-3926.\nwww.celticquestfishing.com";

export function withSignoff(caption: string): string {
  const trimmed = (caption || "").trimEnd();
  return trimmed.length > 0 ? `${trimmed}\n\n${BRAND_SIGNOFF}` : BRAND_SIGNOFF;
}
