-- Conecta Empreendedor (v1)
-- Migração inicial (PostgreSQL).

create extension if not exists "pgcrypto";

-- Domínios/enums (mantidos simples para migração inicial).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'representative_role') then
    create type representative_role as enum ('OWNER', 'ADMIN', 'MEMBER');
  end if;
  if not exists (select 1 from pg_type where typname = 'representative_status') then
    create type representative_status as enum ('PENDING', 'ACTIVE', 'REJECTED', 'DISABLED');
  end if;
  if not exists (select 1 from pg_type where typname = 'service_request_status') then
    create type service_request_status as enum ('OPEN', 'NEGOTIATING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
  end if;
  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type proposal_status as enum ('SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
  end if;
end $$;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text null,
  cnpj text null unique,
  email text null unique,
  phone text null,
  description text null,
  website_url text null,
  industry text null,
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists representatives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role representative_role not null default 'MEMBER',
  status representative_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists follows (
  follower_company_id uuid not null references companies(id) on delete restrict,
  followed_company_id uuid not null references companies(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (follower_company_id, followed_company_id),
  constraint follows_no_self_follow check (follower_company_id <> followed_company_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (post_id, company_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists service_offerings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  category_id uuid not null references service_categories(id) on delete restrict,
  title text not null,
  description text null,
  base_price_cents integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_offerings_company_id on service_offerings(company_id);
create index if not exists idx_service_offerings_category_id on service_offerings(category_id);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  requester_company_id uuid not null references companies(id) on delete restrict,
  category_id uuid not null references service_categories(id) on delete restrict,
  title text not null,
  description text not null,
  status service_request_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_requests_requester_company_id on service_requests(requester_company_id);
create index if not exists idx_service_requests_category_id on service_requests(category_id);
create index if not exists idx_service_requests_status on service_requests(status);

create table if not exists service_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  provider_company_id uuid not null references companies(id) on delete restrict,
  status proposal_status not null default 'SENT',
  price_cents integer null,
  message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uniq_request_provider unique (request_id, provider_company_id)
);

create index if not exists idx_service_proposals_request_id on service_proposals(request_id);
create index if not exists idx_service_proposals_provider_company_id on service_proposals(provider_company_id);

-- Contrato/execução do serviço: criado quando uma proposta é aceita.
create table if not exists service_jobs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete restrict,
  proposal_id uuid not null references service_proposals(id) on delete restrict,
  requester_company_id uuid not null references companies(id) on delete restrict,
  provider_company_id uuid not null references companies(id) on delete restrict,
  status service_request_status not null default 'ACCEPTED',
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uniq_job_request unique (request_id),
  constraint uniq_job_proposal unique (proposal_id),
  constraint job_company_mismatch check (requester_company_id <> provider_company_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references service_jobs(id) on delete restrict,
  reviewer_company_id uuid not null references companies(id) on delete restrict,
  reviewed_company_id uuid not null references companies(id) on delete restrict,
  stars integer not null,
  comment text null,
  created_at timestamptz not null default now(),
  constraint stars_range check (stars between 1 and 5),
  constraint uniq_review_per_pair unique (job_id, reviewer_company_id, reviewed_company_id),
  constraint review_no_self check (reviewer_company_id <> reviewed_company_id)
);

create index if not exists idx_reviews_reviewed_company_id on reviews(reviewed_company_id);

-- Chat entre empresas (uma sala por par de empresas).
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  company_a_id uuid not null references companies(id) on delete restrict,
  company_b_id uuid not null references companies(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint chat_no_self check (company_a_id <> company_b_id),
  constraint uniq_chat_pair unique (company_a_id, company_b_id)
);

-- Normaliza a ordem do par (ainda permite app garantir ordenação).
create index if not exists idx_chats_company_a_id on chats(company_a_id);
create index if not exists idx_chats_company_b_id on chats(company_b_id);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  sender_company_id uuid not null references companies(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_chat_id_created_at on chat_messages(chat_id, created_at);

-- Notificações (v1 simples).
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_company_id_created_at on notifications(company_id, created_at desc);
