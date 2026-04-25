import type { Trip } from "@/lib/types";

export function buildCaptionPrompt(
  trip: Trip,
  weather: string,
  recentCaptions: string[],
  variant: "facebook" | "instagram" | "tiktok" = "facebook"
): string {
  const recentCaptionBlock =
    recentCaptions.length > 0
      ? `\nRecent captions (avoid repeating these openings or phrasing):\n${recentCaptions.map((c, i) => `${i + 1}. "${c}"`).join("\n")}\n`
      : "";

  const platformInstructions = {
    facebook: `Write 1-2 sentences describing what happened on this trip. Plain and factual.`,
    instagram: `Write 1-2 sentences describing what happened on this trip. Plain and factual. After the caption, add a blank line, then 12-18 relevant lowercase hashtags (e.g. fishing, longisland, portjefferson, charterfishing). Do not include URLs or @ mentions.`,
    tiktok: `Write 1 short factual sentence about this trip. No hashtags.`,
  };

  return `You are writing a short factual social media caption for Celtic Quest Fishing, a charter fishing operation out of Port Jefferson, Long Island, NY.

BOAT: ${trip.boat}
DATE: ${trip.date}
TRIP TIME: ${trip.trip_time} trip
PHOTOS: ${trip.photo_count} photos from this trip
${trip.crew_notes ? `CREW NOTES: ${trip.crew_notes}` : ""}
WEATHER: ${weather}

${platformInstructions[variant]}

Style rules — these are strict:
- Plain, factual voice. Sound like a captain sending a quick update, not marketing copy.
- No emojis. No exclamation points. No ALL CAPS.
- No hype words. Do not use: epic, stoked, pumped, crushing, insane, amazing, incredible, awesome, beautiful, killed it, on fire, loaded up, slammed, smashed, fired up, hooked up, dialed in, sick, wild, unreal.
- Mention the boat name once (${trip.boat}).
- Reference Port Jefferson or Long Island Sound only when it fits naturally — do not force it.
- If crew notes mention specific species or counts, state them factually.
- Do NOT include phone numbers, URLs, website addresses, or any "call us / book now" calls to action. Those are appended automatically.
${recentCaptionBlock}
Write ONLY the caption text. No quotes, no labels, no explanations.`;
}
