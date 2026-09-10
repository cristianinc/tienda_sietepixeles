"use client";

import { FormEvent, useState } from "react";

type Message = { id: number; direction: string; sender_type: string; content: string | null; created_at: string };
type Conversation = { id: number; status: string; bot_enabled: boolean; customer_name: string | null; channel: string; messages: Message[] };

export function ConversationDetail({ initialConversation }: { initialConversation: Conversation }) {
  const [conversation, setConversation] = useState(initialConversation);
  const [note, setNote] = useState("");

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    const response = await fetch(`/api/admin/conversations/${conversation.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    if (!response.ok) return;
    const data = await response.json() as { message: Message };
    setConversation((current) => ({ ...current, messages: [...current.messages, data.message] }));
    setNote("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <p className="font-semibold">{conversation.customer_name ?? "Cliente sin identificar"}</p>
        <p className="text-sm text-[var(--color-soft-ink)]">{conversation.channel} · {conversation.status} · Bot {conversation.bot_enabled ? "activo" : "pausado"}</p>
      </div>
      <div className="space-y-3">
        {conversation.messages.map((message) => (
          <article key={message.id} className="rounded-2xl border border-[var(--color-muted)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-soft-ink)]">{message.sender_type} · {message.direction}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{message.content ?? "Evento sin texto"}</p>
          </article>
        ))}
      </div>
      <form onSubmit={saveNote} className="rounded-2xl border border-[var(--color-muted)] bg-white p-5">
        <label className="block text-sm font-semibold">Registrar nota humana
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-[var(--color-muted)] p-3" />
        </label>
        <button type="submit" className="mt-3 rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-white">Guardar nota</button>
      </form>
    </div>
  );
}
