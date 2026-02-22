import { NextRequest, NextResponse } from "next/server";

// Instagram Webhook verification (GET) — Meta sends this to verify your endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("Instagram webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming Instagram events (POST)
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Return 200 quickly to avoid retries from Meta
    console.log("Instagram webhook event:", JSON.stringify(payload, null, 2));

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Instagram webhook parse error:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
