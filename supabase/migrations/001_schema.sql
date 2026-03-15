-- March Madness Snake Draft Scorer - schema
-- Run in Supabase SQL editor or via Supabase CLI

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  draft_position int not null unique check (draft_position between 1 and 8),
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  seed int not null,
  name text not null,
  abbr text not null,
  is_first_four boolean default false,
  ff_team1_name text,
  ff_team1_abbr text,
  ff_team2_name text,
  ff_team2_abbr text,
  ff_winner text,
  owner_id uuid references players(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists draft_picks (
  id uuid primary key default gen_random_uuid(),
  pick_number int not null,
  player_id uuid not null references players(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz default now(),
  unique(pick_number)
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  round int not null,
  region text not null,
  bracket_slot int not null,
  top_team_id uuid references teams(id) on delete set null,
  bottom_team_id uuid references teams(id) on delete set null,
  winner_id uuid references teams(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_teams_owner on teams(owner_id);
create index if not exists idx_teams_region_seed on teams(region, seed);
create index if not exists idx_draft_picks_pick on draft_picks(pick_number);
create index if not exists idx_games_round_region on games(round, region, bracket_slot);

-- Realtime: In Supabase Dashboard, go to Database > Replication and add tables 'teams' and 'games' to the supabase_realtime publication.

-- Permissive RLS (no auth) for no-auth setup (all access via anon key)
alter table players enable row level security;
alter table teams enable row level security;
alter table draft_picks enable row level security;
alter table games enable row level security;

create policy "Allow all players" on players for all using (true) with check (true);
create policy "Allow all teams" on teams for all using (true) with check (true);
create policy "Allow all draft_picks" on draft_picks for all using (true) with check (true);
create policy "Allow all games" on games for all using (true) with check (true);
