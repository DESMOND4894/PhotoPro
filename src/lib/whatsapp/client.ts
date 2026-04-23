import type { WhatsAppSendMessagePayload, WhatsAppMediaResponse } from "./types";
import type { BoatName } from "@/lib/types";
import { logWhatsAppMessage } from "./message-log";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

function getPhoneNumberIdForBoat(boat?: BoatName): string {
  if (boat === "Celtic Quest IV" && process.env.WHATSAPP_PHONE_NUMBER_ID_QUEST_IV) {
    return process.env.WHATSAPP_PHONE_NUMBER_ID_QUEST_IV;
  }
  if (boat === "Celtic Grace" && process.env.WHATSAPP_PHONE_NUMBER_ID_GRACE) {
    return process.env.WHATSAPP_PHONE_NUMBER_ID_GRACE;
  }
  return process.env.WHATSAPP_PHONE_NUMBER_ID!;
}

function getAccessToken(): string {
  return process.env.WHATSAPP_ACCESS_TOKEN!;
}

async function whatsappFetch(
  endpoint: string,
  options: RequestInit = {},
  boat?: BoatName
): Promise<Response> {
  const url = `${WHATSAPP_API_URL}/${getPhoneNumberIdForBoat(boat)}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`WhatsApp API error [${response.status}]:`, error);
    throw new Error(`WhatsApp API error: ${response.status} — ${error}`);
  }

  return response;
}

export async function sendTextMessage(to: string, body: string, boat?: BoatName): Promise<void> {
  const payload: WhatsAppSendMessagePayload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  };

  await whatsappFetch("messages", {
    method: "POST",
    body: JSON.stringify(payload),
  }, boat);

  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE?.trim();
  await logWhatsAppMessage({
    direction: "outbound",
    recipientPhone: to,
    messageType: "text",
    content: body,
    isCaptain: to === captainPhone,
  });
}

export async function sendInteractiveButtons(
  to: string,
  body: string,
  buttons: Array<{ id: string; title: string }>,
  boat?: BoatName
): Promise<void> {
  const payload: WhatsAppSendMessagePayload = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply" as const,
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  };

  await whatsappFetch("messages", {
    method: "POST",
    body: JSON.stringify(payload),
  }, boat);

  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE?.trim();
  await logWhatsAppMessage({
    direction: "outbound",
    recipientPhone: to,
    messageType: "interactive",
    content: body,
    isCaptain: to === captainPhone,
  });
}

export async function downloadMedia(mediaId: string): Promise<Buffer> {
  // Step 1: Get media URL
  const metaResponse = await fetch(
    `${WHATSAPP_API_URL}/${mediaId}`,
    {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }
  );

  if (!metaResponse.ok) {
    throw new Error(`Failed to get media URL: ${metaResponse.status}`);
  }

  const mediaInfo: WhatsAppMediaResponse = await metaResponse.json();

  // Step 2: Download the actual file
  const fileResponse = await fetch(mediaInfo.url, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  if (!fileResponse.ok) {
    throw new Error(`Failed to download media: ${fileResponse.status}`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendCaptainNotification(
  tripId: string,
  boat: BoatName,
  tripTime: string,
  photoCount: number,
  caption: string
): Promise<void> {
  const captainPhone = process.env.WHATSAPP_CAPTAIN_PHONE!.trim();

  const message =
    `📸 ${boat} — ${tripTime.charAt(0).toUpperCase() + tripTime.slice(1)} Trip\n` +
    `${photoCount} photos ready to post\n\n` +
    `Caption:\n"${caption}"\n\n` +
    `Reply:\n` +
    `OK = Approve & post\n` +
    `EDIT = New caption\n` +
    `SKIP = Don't post\n` +
    `Or type your own caption to use it\n\n` +
    `Trip ID: ${tripId.slice(0, 8)}`;

  await sendTextMessage(captainPhone, message, boat);
}

export async function sendChatConfirmation(
  to: string,
  boat: BoatName,
  photoCount: number
): Promise<void> {
  const message = `📸 ${photoCount} photos received for ${boat} ${
    new Date().getHours() < 13 ? "morning" : "afternoon"
  } trip. Generating caption…`;

  await sendTextMessage(to, message, boat);
}

export async function sendPostingConfirmation(
  to: string,
  boat: BoatName,
  platforms: string[]
): Promise<void> {
  const platformList = platforms
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(", ");

  const message = `✅ ${boat} batch approved! Posting to ${platformList} now.`;
  await sendTextMessage(to, message, boat);
}
