import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { appendConversationMessage, getConversation, updateConversation } from "@/lib/commercial/repository";
import { conversationUpdateSchema, humanNoteSchema } from "@/lib/validations/conversation.schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const conversation = await getConversation(Number(id));
  if (!conversation) return Response.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 });
  return Response.json({ ok: true, conversation });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const parsed = conversationUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });

  const conversation = await updateConversation(Number(id), parsed.data);
  if (!conversation) return Response.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 });
  return Response.json({ ok: true, conversation });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const { id } = await params;
  const parsed = humanNoteSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });

  const conversation = await getConversation(Number(id));
  if (!conversation) return Response.json({ ok: false, error: "Conversación no encontrada" }, { status: 404 });

  const message = await appendConversationMessage({
    conversationId: Number(id),
    direction: "internal",
    senderType: "human",
    content: parsed.data.content,
  });
  return Response.json({ ok: true, message }, { status: 201 });
}
