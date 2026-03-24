import { createServiceClient } from "@/lib/supabase/server";

interface FacebookTokenResult {
  token: string;
  pageId: string;
}

interface InstagramTokenResult {
  token: string;
  igAccountId: string;
}

export async function getFacebookPageToken(): Promise<FacebookTokenResult> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("social_connections")
      .select("access_token, page_id")
      .eq("platform", "facebook")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.access_token && data?.page_id) {
      return { token: data.access_token, pageId: data.page_id };
    }
  } catch {
    console.log("No Facebook connection in DB, falling back to env vars");
  }

  return {
    token: process.env.META_PAGE_ACCESS_TOKEN!,
    pageId: process.env.META_PAGE_ID!,
  };
}

export async function getInstagramCredentials(): Promise<InstagramTokenResult> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("social_connections")
      .select("access_token, ig_account_id")
      .eq("platform", "instagram")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.access_token && data?.ig_account_id) {
      return { token: data.access_token, igAccountId: data.ig_account_id };
    }
  } catch {
    console.log("No Instagram connection in DB, falling back to env vars");
  }

  return {
    token: process.env.META_USER_ACCESS_TOKEN || process.env.META_PAGE_ACCESS_TOKEN!,
    igAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!,
  };
}
