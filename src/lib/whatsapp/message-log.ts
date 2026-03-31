import { createServiceClient } from "@/lib/supabase/server";

interface LogMessageParams {
  direction: "inbound" | "outbound";
  senderPhone?: string;
  recipientPhone?: string;
  messageType: "text" | "image" | "reaction" | "interactive";
  content?: string;
  whatsappMessageId?: string;
  mediaId?: string;
  tripId?: string;
  isCaptain?: boolean;
}

export async function logWhatsAppMessage(params: LogMessageParams): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("whatsapp_messages").insert({
      direction: params.direction,
      sender_phone: params.senderPhone || null,
      recipient_phone: params.recipientPhone || null,
      message_type: params.messageType,
      content: params.content || null,
      whatsapp_message_id: params.whatsappMessageId || null,
      media_id: params.mediaId || null,
      trip_id: params.tripId || null,
      is_captain: params.isCaptain || false,
    });
  } catch (err) {
    // Never let logging failures break the main flow
    console.error("Failed to log WhatsApp message:", err);
  }
}
