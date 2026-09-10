import { z } from "zod";

export const conversationUpdateSchema = z.object({
  status: z.enum(["open", "human", "closed"]).optional(),
  bot_enabled: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "Debes actualizar al menos un campo");

export const humanNoteSchema = z.object({
  content: z.string().trim().min(1).max(4_000),
});
