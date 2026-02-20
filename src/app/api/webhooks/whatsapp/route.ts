import { NextRequest, NextResponse } from "next/server";
import type { WhatsAppWebhookPayload } from "@/lib/types";
import {
  handleIncomingPhoto,
  handleIncomingText,
  handleIncomingReaction,
} from "@/lib/whatsapp/webhook-handler";

// Webhook verification (GET) — Meta sends this to verify your endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages (POST)
export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await request.json();

    // WhatsApp requires 200 quickly to avoid retries
    // Process messages asynchronously
    processWebhook(payload).catch((err) =>
      console.error("Webhook processing error:", err)
    );

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook parse error:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

async function processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;

      const messages = change.value.messages;
      if (!messages) continue;

      for (const message of messages) {
        const senderPhone = message.from;
        // Group messages include a group ID in the context
        const groupId = message.context?.from;

        try {
          switch (message.type) {
            case "image":
              await handleIncomingPhoto(message, senderPhone, groupId);
              break;

            case "text":
              await handleIncomingText(message, senderPhone, groupId);
              break;

            case "reaction":
              await handleIncomingReaction(message, senderPhone);
              break;

            default:
              console.log(`Ignoring message type: ${message.type}`);
          }
        } catch (error) {
          console.error(
            `Error processing ${message.type} from ${senderPhone}:`,
            error
          );
        }
      }
    }
  }
}
