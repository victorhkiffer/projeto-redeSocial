-- Auth sessions (refresh tokens)

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  representative_id uuid not null references representatives(id) on delete cascade,
  refresh_token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_sessions_representative_id on auth_sessions(representative_id);
create index if not exists idx_auth_sessions_expires_at on auth_sessions(expires_at);

