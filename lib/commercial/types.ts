export const commercialChannels = ["manual", "whatsapp", "instagram", "facebook"] as const;
export type CommercialChannel = (typeof commercialChannels)[number];

export type CustomerInput = {
  channel: CommercialChannel;
  externalId?: string;
  displayName?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
};

export type ConversationInput = {
  channel: CommercialChannel;
  customerId?: number;
  externalConversationId?: string;
};

export type ConversationMessageInput = {
  conversationId: number;
  externalMessageId?: string;
  direction: "incoming" | "outgoing" | "internal";
  senderType: "customer" | "agent" | "human" | "system";
  messageType?: "text" | "image" | "template" | "event";
  content?: string;
  metadata?: Record<string, unknown>;
};

export type SalesLeadInput = {
  sourceChannel: CommercialChannel;
  customerId?: number;
  conversationId?: number;
  notes?: string;
  productContext?: Array<{ productId: number; variantId?: number }>;
};
