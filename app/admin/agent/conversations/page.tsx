import Link from "next/link";
import { ConversationManager } from "@/components/admin/ConversationManager";
import { getConversations } from "@/lib/commercial/repository";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await getConversations();
  return <section className="mx-auto max-w-4xl space-y-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-soft-ink)]">Agente comercial</p><h1 className="font-serif text-4xl">Conversaciones</h1></div><Link href="/admin/agent" className="rounded-full border border-[var(--color-muted)] px-5 py-2 text-sm font-semibold">Volver</Link></div><ConversationManager initialConversations={conversations} /></section>;
}
