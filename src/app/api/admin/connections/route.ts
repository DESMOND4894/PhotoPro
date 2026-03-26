import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("social_connections")
    .select("id, platform, platform_user_id, platform_name, token_expires_at, page_id, ig_account_id, scopes, connected_by_name, updated_at")
    .order("platform", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections: data });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch the connection to get the token for revoking
  const { data: connection } = await supabase
    .from("social_connections")
    .select("access_token, platform_user_id")
    .eq("id", id)
    .single();

  // Revoke the token on Facebook's side
  if (connection?.access_token) {
    try {
      const revokeRes = await fetch(
        `https://graph.facebook.com/v21.0/${connection.platform_user_id}/permissions?access_token=${connection.access_token}`,
        { method: "DELETE" }
      );
      const revokeData = await revokeRes.json();
      console.log("Facebook permission revoke:", revokeData);
    } catch (err) {
      console.error("Failed to revoke Facebook permissions:", err);
    }
  }

  // Delete all connections (revoking one revokes all)
  const { error } = await supabase.from("social_connections").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
