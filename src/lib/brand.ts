export const BRAND_SIGNOFF =
  "🎣 SAILING OPEN BOAT DAILY\n⚓ Private Charters Arranged\n\n🌐 www.celticquestfishing.com\n\n📞 631-928-3926\n\n✉️ office@cqfleet.com\n\nGreat Family Fishing Trips Sailing Daily!";

export function withSignoff(caption: string): string {
  const trimmed = (caption || "").trimEnd();
  return trimmed.length > 0 ? `${trimmed}\n\n${BRAND_SIGNOFF}` : BRAND_SIGNOFF;
}
