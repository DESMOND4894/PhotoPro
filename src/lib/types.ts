export type BoatName = "Celtic Quest IV" | "Celtic Grace";

export type TripTime = "morning" | "afternoon";

export type TripStatus = "receiving" | "pending" | "approved" | "posting" | "posted" | "skipped" | "failed";

export type SocialPlatform = "facebook" | "instagram" | "tiktok";

export interface Trip {
  id: string;
  boat: BoatName;
  date: string; // YYYY-MM-DD
  trip_time: TripTime;
  photo_count: number;
  photo_urls: string[];
  caption: string | null;
  caption_facebook: string | null;
  caption_instagram: string | null;
  caption_tiktok: string | null;
  status: TripStatus;
  approved_at: string | null;
  posted_to: SocialPlatform[];
  platforms_enabled: SocialPlatform[];
  crew_notes: string | null;
  weather_summary: string | null;
  created_at: string;
  updated_at: string;
  last_photo_at: string | null;
  batch_complete: boolean;
  public_enabled: boolean;
  public_slug: string | null;
  public_published_at: string | null;
  public_cover_photo_id: string | null;
  public_title: string | null;
  public_subtitle: string | null;
  public_crew_note: string | null;
  show_public_crew_note: boolean;
  public_review_url: string | null;
  public_tag_us_text: string | null;
  public_tag_us_url: string | null;
  public_book_again_url: string | null;
  public_copy_caption: string | null;
  public_copy_hashtags: string | null;
  featured_photo_ids: string[];
  public_species_tags: string[];
}

export interface Photo {
  id: string;
  trip_id: string;
  storage_path: string;
  public_url: string;
  whatsapp_media_id: string;
  image_hash: string | null;
  is_duplicate: boolean;
  watermarked_url: string | null;
  uploaded_at: string;
}

export interface CaptionHistory {
  id: string;
  trip_id: string;
  caption: string;
  style: string;
  created_at: string;
}

export interface PostingLog {
  id: string;
  trip_id: string;
  platform: SocialPlatform;
  platform_post_id: string | null;
  status: "pending" | "posting" | "posted" | "failed";
  error_message: string | null;
  posted_at: string | null;
  scheduled_for: string | null;
  created_at: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: "text" | "image" | "video" | "document" | "reaction";
  text?: { body: string };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
  context?: {
    from: string;
    id: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export const BOATS: Record<string, BoatName> = {
  celtic_quest_iv: "Celtic Quest IV",
  celtic_grace: "Celtic Grace",
};

export const BOAT_GROUP_MAP: Record<string, BoatName> = {};

export function getBoatSlug(boat: BoatName): string {
  return boat.toLowerCase().replace(/\s+/g, "-");
}

export function getTripTime(): TripTime {
  const hour = new Date().getHours();
  return hour < 13 ? "morning" : "afternoon";
}

export function formatTripLabel(boat: BoatName, tripTime: TripTime, date: string): string {
  const d = new Date(date + "T12:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${boat} — ${tripTime.charAt(0).toUpperCase() + tripTime.slice(1)} Trip — ${formatted}`;
}
