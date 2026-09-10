import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationDetail } from "@/components/admin/ConversationDetail";
import { getConversation } from "@/lib/commercial/repository";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(Number(id));
  if (!conversation) notFound();
  return <section className="mx-auto max-w-3xl space-y-6"><Link href="/admin/agent/conversations" className="text-sm font-semibold text-[var(--color-clay)]">Volver a conversaciones</Link><h1 className="font-serif text-4xl">Conversación #{conversation.id}</h1><ConversationDetail initialConversation={conversation} /></section>;
}
