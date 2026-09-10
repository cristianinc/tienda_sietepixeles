import { getDb } from "@/lib/db";
import type { ConversationInput, ConversationMessageInput, CustomerInput, SalesLeadInput } from "./types";

const json = (value: unknown) => JSON.stringify(value ?? {});

export async function upsertCustomer(input: CustomerInput) {
  const db = getDb();
  const { rows } = await db.query(
    `
      insert into customers (channel, external_id, display_name, phone, metadata)
      values ($1, $2, $3, $4, $5::jsonb)
      on conflict (channel, external_id) do update
      set display_name = coalesce(excluded.display_name, customers.display_name),
          phone = coalesce(excluded.phone, customers.phone),
          metadata = customers.metadata || excluded.metadata,
          updated_at = now()
      returning *
    `,
    [input.channel, input.externalId ?? null, input.displayName ?? null, input.phone ?? null, json(input.metadata)],
  );
  return rows[0];
}

export async function createConversation(input: ConversationInput) {
  const db = getDb();
  const { rows } = await db.query(
    `
      insert into conversations (channel, customer_id, external_conversation_id)
      values ($1, $2, $3)
      on conflict (channel, external_conversation_id) do update
      set customer_id = coalesce(excluded.customer_id, conversations.customer_id), updated_at = now()
      returning *
    `,
    [input.channel, input.customerId ?? null, input.externalConversationId ?? null],
  );
  return rows[0];
}

export async function appendConversationMessage(input: ConversationMessageInput) {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      `
        insert into conversation_messages (conversation_id, external_message_id, direction, sender_type, message_type, content, metadata)
        values ($1, $2, $3, $4, $5, $6, $7::jsonb)
        on conflict (conversation_id, external_message_id) do nothing
        returning *
      `,
      [input.conversationId, input.externalMessageId ?? null, input.direction, input.senderType, input.messageType ?? "text", input.content ?? null, json(input.metadata)],
    );
    await client.query(
      "update conversations set last_message_at = now(), updated_at = now() where id = $1",
      [input.conversationId],
    );
    await client.query("commit");
    return rows[0] ?? null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createSalesLead(input: SalesLeadInput) {
  const db = getDb();
  const { rows } = await db.query(
    `
      insert into sales_leads (source_channel, customer_id, conversation_id, notes, product_context)
      values ($1, $2, $3, $4, $5::jsonb)
      returning *
    `,
    [input.sourceChannel, input.customerId ?? null, input.conversationId ?? null, input.notes ?? null, json(input.productContext ?? [])],
  );
  return rows[0];
}

export async function getConversations(status?: "open" | "human" | "closed") {
  const db = getDb();
  const { rows } = await db.query(
    `
      select c.id, c.channel, c.status, c.bot_enabled, c.assigned_to, c.last_message_at, c.created_at,
        cu.display_name as customer_name, cu.phone as customer_phone,
        coalesce(last_message.content, '') as last_message
      from conversations c
      left join customers cu on cu.id = c.customer_id
      left join lateral (
        select content from conversation_messages where conversation_id = c.id order by created_at desc limit 1
      ) last_message on true
      where ($1::text is null or c.status = $1)
      order by c.last_message_at desc nulls last, c.created_at desc
    `,
    [status ?? null],
  );
  return rows;
}

export async function getConversation(id: number) {
  const db = getDb();
  const { rows } = await db.query(
    `
      select c.*, cu.display_name as customer_name, cu.phone as customer_phone
      from conversations c
      left join customers cu on cu.id = c.customer_id
      where c.id = $1
    `,
    [id],
  );
  if (!rows[0]) return null;

  const messages = await db.query(
    "select * from conversation_messages where conversation_id = $1 order by created_at asc, id asc",
    [id],
  );
  return { ...rows[0], messages: messages.rows };
}

export async function updateConversation(
  id: number,
  input: { status?: "open" | "human" | "closed"; bot_enabled?: boolean; assigned_to?: string | null },
) {
  const fields = Object.keys(input);
  const values = fields.map((field) => input[field as keyof typeof input]);
  const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
  const db = getDb();
  const { rows } = await db.query(
    `update conversations set ${setClause}, updated_at = now() where id = $${fields.length + 1} returning *`,
    [...values, id],
  );
  return rows[0] ?? null;
}
