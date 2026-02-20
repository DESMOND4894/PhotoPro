import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { getPortJeffWeather } from "@/lib/weather/open-meteo";
import { buildCaptionPrompt } from "./prompts";
import type { Trip, SocialPlatform } from "@/lib/types";

const anthropic = new Anthropic();

export async function generateCaption(trip: Trip): Promise<string> {
  const supabase = createServiceClient();

  // Fetch weather
  const weather = await getPortJeffWeather();

  // Fetch recent captions for variety
  const { data: recentCaptions } = await supabase
    .from("caption_history")
    .select("caption")
    .eq("boat", trip.boat)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentCaptionTexts = (recentCaptions || []).map((c) => c.caption);

  // Generate the main (Facebook) caption
  const prompt = buildCaptionPrompt(trip, weather, recentCaptionTexts, "facebook");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const caption =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Save to caption history
  await supabase.from("caption_history").insert({
    trip_id: trip.id,
    boat: trip.boat,
    caption,
    style: "standard",
  });

  // Update weather summary on the trip
  await supabase
    .from("trips")
    .update({ weather_summary: weather })
    .eq("id", trip.id);

  return caption;
}

export async function generatePlatformVariant(
  trip: Trip,
  platform: SocialPlatform
): Promise<string> {
  if (platform === "facebook") {
    return trip.caption || trip.caption_facebook || "";
  }

  const supabase = createServiceClient();
  const weather = trip.weather_summary || (await getPortJeffWeather());

  const { data: recentCaptions } = await supabase
    .from("caption_history")
    .select("caption")
    .eq("boat", trip.boat)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentCaptionTexts = (recentCaptions || []).map((c) => c.caption);
  const prompt = buildCaptionPrompt(
    trip,
    weather,
    recentCaptionTexts,
    platform
  );

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const variant =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Store the variant
  const updateField =
    platform === "instagram"
      ? "caption_instagram"
      : "caption_tiktok";

  await supabase
    .from("trips")
    .update({ [updateField]: variant })
    .eq("id", trip.id);

  return variant;
}
