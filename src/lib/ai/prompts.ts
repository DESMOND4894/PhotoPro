import type { Trip } from "@/lib/types";

export function buildCaptionPrompt(
  trip: Trip,
  weather: string,
  recentCaptions: string[],
  variant: "facebook" | "instagram" | "tiktok" = "facebook"
): string {
  const recentCaptionBlock =
    recentCaptions.length > 0
      ? `\nRecent captions (AVOID repeating these styles and phrases):\n${recentCaptions.map((c, i) => `${i + 1}. "${c}"`).join("\n")}\n`
      : "";

  const platformInstructions = {
    facebook: `Write a Facebook post caption. Include a booking link to celticquestfishing.com at the end. Keep it 2-4 sentences. Energetic, authentic fishing charter voice.`,
    instagram: `Write an Instagram caption. Include a booking link to celticquestfishing.com. After the caption, add a blank line and then 15-20 relevant hashtags (fishing, Long Island, Port Jefferson, charter fishing, etc.). Keep caption 2-4 sentences.`,
    tiktok: `Write a short, punchy TikTok caption. Max 2 sentences. Use 1-2 relevant emojis. No link needed. Hook the viewer.`,
  };

  return `You are the social media voice for Celtic Quest Fishing, a charter fishing operation out of Port Jefferson, Long Island, NY. You write exciting, authentic fishing captions that get customers pumped to book trips.

BOAT: ${trip.boat}
DATE: ${trip.date}
TRIP TIME: ${trip.trip_time} trip
PHOTOS: ${trip.photo_count} photos from this trip
${trip.crew_notes ? `CREW NOTES: ${trip.crew_notes}` : ""}
WEATHER: ${weather}

${platformInstructions[variant]}

Style guidelines:
- Sound like a real fishing captain, not a marketing agency
- Use natural excitement — ALL CAPS for emphasis sparingly (1-2 words max)
- Mention the boat name (${trip.boat})
- Reference Port Jefferson / Port Jeff / Long Island Sound when it fits naturally
- If crew notes mention specific fish species or catches, highlight them
- Vary your openings and energy — don't always start the same way
- Use 1-3 fishing/outdoor emojis naturally (🎣 🔥 💪 🐟 ☀️ etc.)
${recentCaptionBlock}
Write ONLY the caption text. No quotes, no labels, no explanations.`;
}
