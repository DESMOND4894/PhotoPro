const GRAPH_API_URL = "https://graph.facebook.com/v21.0";

const OAUTH_SCOPES = [
  "pages_manage_posts",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

export function buildFacebookOAuthURL(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPES,
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${GRAPH_API_URL}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  return res.json();
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(`${GRAPH_API_URL}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Long-lived token exchange failed: ${error}`);
  }
  return res.json();
}

export async function fetchUserInfo(token: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`${GRAPH_API_URL}/me?fields=id,name&access_token=${token}`);
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json();
}

export async function fetchGrantedPermissions(token: string): Promise<string[]> {
  const res = await fetch(`${GRAPH_API_URL}/me/permissions?access_token=${token}`);
  if (!res.ok) throw new Error("Failed to fetch permissions");
  const data = await res.json();
  return data.data
    .filter((p: { status: string }) => p.status === "granted")
    .map((p: { permission: string }) => p.permission);
}

export interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

export async function fetchUserPages(token: string): Promise<PageInfo[]> {
  const res = await fetch(
    `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`
  );
  if (!res.ok) throw new Error("Failed to fetch pages");
  const data = await res.json();
  return data.data || [];
}
