create table if not exists customers (
  id bigserial primary key,
  channel text not null check (channel in ('manual', 'whatsapp', 'instagram', 'facebook')),
  external_id text,
  display_name text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_id)
);

create table if not exists conversations (
  id bigserial primary key,
  channel text not null check (channel in ('manual', 'whatsapp', 'instagram', 'facebook')),
  external_conversation_id text,
  customer_id bigint references customers(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'human', 'closed')),
  bot_enabled boolean not null default true,
  assigned_to uuid,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_conversation_id)
);

create table if not exists conversation_messages (
  id bigserial primary key,
  conversation_id bigint not null references conversations(id) on delete cascade,
  external_message_id text,
  direction text not null check (direction in ('incoming', 'outgoing', 'internal')),
  sender_type text not null check (sender_type in ('customer', 'agent', 'human', 'system')),
  message_type text not null default 'text' check (message_type in ('text', 'image', 'template', 'event')),
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (conversation_id, external_message_id)
);

create table if not exists sales_leads (
  id bigserial primary key,
  conversation_id bigint references conversations(id) on delete set null,
  customer_id bigint references customers(id) on delete set null,
  source_channel text not null check (source_channel in ('manual', 'whatsapp', 'instagram', 'facebook')),
  status text not null default 'open' check (status in ('open', 'contacted', 'won', 'lost')),
  notes text,
  product_context jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_customer_status on conversations(customer_id, status, last_message_at desc);
create index if not exists idx_conversations_channel_status on conversations(channel, status, last_message_at desc);
create index if not exists idx_conversation_messages_conversation_created on conversation_messages(conversation_id, created_at);
create index if not exists idx_sales_leads_status_created on sales_leads(status, created_at desc);
create index if not exists idx_sales_leads_customer on sales_leads(customer_id, created_at desc);
