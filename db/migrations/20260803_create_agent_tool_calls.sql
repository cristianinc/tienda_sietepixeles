create table if not exists agent_tool_calls (
  id bigserial primary key,
  tool_name text not null check (tool_name in ('search_products', 'get_product_details', 'check_inventory', 'get_store_information')),
  input jsonb not null,
  output jsonb,
  status text not null check (status in ('success', 'error')),
  error_code text,
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_tool_calls_created_at on agent_tool_calls(created_at desc);
create index if not exists idx_agent_tool_calls_tool_status on agent_tool_calls(tool_name, status);
