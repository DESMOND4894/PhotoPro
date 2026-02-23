import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(`${new Date().toISOString()} ${msg}`);
    console.log(msg);
  };

  try {
    log("Starting test-edit flow");

    // Step 1: Check env vars
    const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE;
    log(`WHATSAPP_CAPTAIN_PHONE = "${captainPhone}"`);
    log(`ANTHROPIC_API_KEY exists = ${!!process.env.ANTHROPIC_API_KEY}`);
    log(`ANTHROPIC_API_KEY prefix = ${process.env.ANTHROPIC_API_KEY?.slice(0, 10)}...`);

    // Step 2: Check Supabase for pending trips
    const supabase = createServiceClient();
    log("Supabase client created");

    const { data: pendingTrips, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (tripError) {
      log(`Trip query error: ${tripError.message}`);
    } else if (!pendingTrips) {
      log("No pending trips found");
    } else {
      log(`Found pending trip: ${pendingTrips.id} (${pendingTrips.boat} ${pendingTrips.trip_time})`);
      log(`Current caption length: ${pendingTrips.caption?.length || 0}`);
    }

    // Step 3: Try generating a caption
    if (pendingTrips) {
      log("Importing caption-generator...");
      const { generateCaption } = await import("@/lib/ai/caption-generator");
      log("Calling generateCaption...");
      const newCaption = await generateCaption(pendingTrips);
      log(`Caption generated! Length: ${newCaption.length}`);
      log(`Caption preview: ${newCaption.slice(0, 100)}...`);
    }

    return NextResponse.json({ status: "ok", logs });
  } catch (error) {
    log(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    log(`Stack: ${error instanceof Error ? error.stack : "N/A"}`);
    return NextResponse.json({ status: "error", logs }, { status: 500 });
  }
}
