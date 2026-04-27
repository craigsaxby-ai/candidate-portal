-- ─── career_conversations ────────────────────────────────────────────────────
-- Stores Career Coach and Pre-Screen conversation transcripts for candidates.
-- Run this in: Supabase → SQL Editor → Run

create table if not exists career_conversations (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  conversation_type     text not null check (conversation_type in ('career_coach', 'pre_screen')),
  questions_asked       jsonb not null default '[]',
  responses             jsonb not null default '[]',
  erica_summary         text,
  profile_data_extracted jsonb default '{}',
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Index for fast lookup by user
create index if not exists idx_career_conversations_user_id
  on career_conversations(user_id);

-- Index for filtering by type
create index if not exists idx_career_conversations_type
  on career_conversations(conversation_type);

-- RLS
alter table career_conversations enable row level security;

-- Candidates can only read/write their own conversations
create policy "Candidates can manage their own conversations"
  on career_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role full access (for Engine API)
create policy "Service role full access — career_conversations"
  on career_conversations for all
  using (true)
  with check (true);

-- ─── candidate_profiles ───────────────────────────────────────────────────────
-- Stores the candidate's built profile (from Career Coach + manual form).

create table if not exists candidate_profiles (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  full_name               text,
  email                   text,
  current_role            text,
  current_company         text,
  years_experience        text,
  location                text,
  open_to_relocation      boolean default false,
  notice_period           text,
  target_roles            jsonb default '[]',
  ideal_next_role         text,
  salary_min              text,
  salary_max              text,
  current_salary          text,
  current_package         text,
  linkedin_url            text,
  bio                     text,
  skills                  jsonb default '[]',
  cv_url                  text,
  qualifications          text,
  is_open_to_opportunities text default 'open' check (is_open_to_opportunities in ('actively_looking', 'open', 'not_looking')),
  career_coach_completed  boolean default false,
  profile_complete_pct    integer default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- RLS
alter table candidate_profiles enable row level security;

create policy "Candidates can manage their own profile"
  on candidate_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access — candidate_profiles"
  on candidate_profiles for all
  using (true)
  with check (true);

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_career_conversations_updated_at
  before update on career_conversations
  for each row execute function set_updated_at();

create trigger trg_candidate_profiles_updated_at
  before update on candidate_profiles
  for each row execute function set_updated_at();
