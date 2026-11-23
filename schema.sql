-- Provision in Supabase when verified score submission is implemented.
create table if not exists public.nothing_scores (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 display_name text not null check (char_length(display_name) between 2 and 32),
 score integer not null check (score between 0 and 100000),
 created_at timestamptz not null default now()
);
create index if not exists nothing_scores_rank_idx on public.nothing_scores(score desc,created_at asc);
alter table public.nothing_scores enable row level security;
