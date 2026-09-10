create table if not exists admin_users (
  id bigserial primary key,
  email text not null unique check (email = lower(email)),
  password_hash text not null,
  totp_secret_encrypted text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token_hash text primary key,
  admin_user_id bigint not null references admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_sessions_user_expires
  on admin_sessions(admin_user_id, expires_at);

create table if not exists admin_login_challenges (
  token_hash text primary key,
  admin_user_id bigint not null references admin_users(id) on delete cascade,
  purpose text not null check (purpose in ('login', 'setup')),
  pending_totp_secret_encrypted text,
  attempts integer not null default 0 check (attempts >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check ((purpose = 'setup') = (pending_totp_secret_encrypted is not null))
);

create index if not exists idx_admin_login_challenges_user_expires
  on admin_login_challenges(admin_user_id, expires_at);

create table if not exists admin_login_rate_limits (
  bucket_key text primary key,
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now()
);
