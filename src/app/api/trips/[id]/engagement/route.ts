import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getFacebookPageToken, getInstagramCredentials } from "@/lib/social/tokens";

const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

interface PlatformEngagement {
  platform: string;
  likes: number;
  comments: number;
  shares?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const service = createServiceClient();

  // Get posting_log entries with platform_post_ids
  const { data: logs } = await service
    .from("posting_log")
    .select("platform, platform_post_id, status")
    .eq("trip_id", id)
    .eq("status", "posted");

  if (!logs || logs.length === 0) {
    return NextResponse.json({ engagement: [] });
  }

  const engagement: PlatformEngagement[] = [];

  for (const log of logs) {
    if (!log.platform_post_id) continue;

    try {
      if (log.platform === "facebook") {
        const { token } = await getFacebookPageToken();
        const res = await fetch(
          `${GRAPH_API_URL}/${log.platform_post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token=${token}`
        );
        if (res.ok) {
          const data = await res.json();
          engagement.push({
            platform: "facebook",
            likes: data.likes?.summary?.total_count ?? 0,
            comments: data.comments?.summary?.total_count ?? 0,
            shares: data.shares?.count ?? 0,
          });
        }
      } else if (log.platform === "instagram") {
        const { token } = await getInstagramCredentials();
        const res = await fetch(
          `${GRAPH_API_URL}/${log.platform_post_id}?fields=like_count,comments_count&access_token=${token}`
        );
        if (res.ok) {
          const data = await res.json();
          engagement.push({
            platform: "instagram",
            likes: data.like_count ?? 0,
            comments: data.comments_count ?? 0,
          });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${log.platform} engagement:`, err);
    }
  }

  return NextResponse.json({ engagement });
}
