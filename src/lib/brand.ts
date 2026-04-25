export const BRAND_SIGNOFF =
  "🎣 Sailing open boat daily — private charters arranged.\n🌐 Check our schedule at www.celticquestfishing.com\n\n📞 Or call us anytime at 631-928-3926\n✉️ office@cqfleet.com";

export function withSignoff(caption: string): string {
  const trimmed = (caption || "").trimEnd();
  return trimmed.length > 0 ? `${trimmed}\n\n${BRAND_SIGNOFF}` : BRAND_SIGNOFF;
}
