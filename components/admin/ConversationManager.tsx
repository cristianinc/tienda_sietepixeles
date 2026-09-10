"use client";

import Link from "next/link";
import { useState } from "react";

type Conversation = {
  id: number;
  channel: string;
  status: "open" | "human" | "closed";
  bot_enabled: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  last_message: string;
  last_message_at: string | null;
};

type Props = { initialConversations: Conversation[] };

const labels = { open: "Abierta", human: "Atención humana", closed: "Cerrada" };

export function ConversationManager({ initialConversations }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [status, setStatus] = useState<"" | Conversation["status"]>("");

  async function updateConversation(id: number, payload: Partial<Pick<Conversation, "status" | "bot_enabled">>) {
    const response = await fetch(`/api/admin/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    const data = await response.json() as { conversation: Conversation };
    setConversations((current) => current.map((item) => item.id === id ? { ...item, ...data.conversation } : item));
  }

  const visible = status ? conversations.filter((conversation) => conversation.status === status) : conversations;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStatus("")} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">Todas</button>
        {(Object.keys(labels) as Conversation["status"][]).map((value) => (
          <button key={value} type="button" onClick={() => setStatus(value)} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">
            {labels[value]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="rounded-2xl border border-[var(--color-muted)] bg-white p-6 text-[var(--color-soft-ink)]">Aún no hay conversaciones registradas.</p> : null}
      <div className="space-y-3">
        {visible.map((conversation) => (
          <article key={conversation.id} className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{conversation.customer_name ?? "Cliente sin identificar"}</p>
                <p className="text-sm text-[var(--color-soft-ink)]">{conversation.channel} · {labels[conversation.status]} · Bot {conversation.bot_enabled ? "activo" : "pausado"}</p>
              </div>
              <Link href={`/admin/agent/conversations/${conversation.id}`} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">Ver detalle</Link>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-[var(--color-soft-ink)]">{conversation.last_message || "Sin mensajes todavía."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {conversation.status !== "human" ? <button type="button" onClick={() => updateConversation(conversation.id, { status: "human", bot_enabled: false })} className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white">Tomar atención humana</button> : null}
              {conversation.status === "human" ? <button type="button" onClick={() => updateConversation(conversation.id, { status: "open", bot_enabled: true })} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">Reactivar bot</button> : null}
              {conversation.status !== "closed" ? <button type="button" onClick={() => updateConversation(conversation.id, { status: "closed", bot_enabled: false })} className="rounded-full border border-[var(--color-muted)] px-4 py-2 text-sm font-semibold">Cerrar</button> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
