export interface WhatsAppSendMessagePayload {
  messaging_product: "whatsapp";
  to: string;
  type: "text" | "image" | "template" | "interactive";
  text?: {
    body: string;
    preview_url?: boolean;
  };
  interactive?: {
    type: "button" | "list";
    body: { text: string };
    action: {
      buttons?: Array<{
        type: "reply";
        reply: { id: string; title: string };
      }>;
    };
  };
}

export interface WhatsAppMediaResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}

export interface GroupParticipant {
  phone: string;
  name: string;
}
