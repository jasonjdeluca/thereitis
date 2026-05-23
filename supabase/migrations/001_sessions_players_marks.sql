-- Sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null default 'hilton',
  call_identifier text not null default 'Q2 2026',
  session_code text not null unique,
  started_at timestamptz default now(),
  ended_at timestamptz,
  status text not null default 'lobby',
  player_count integer default 0
);

-- Players table
create table players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  display_name text not null,
  card_layout jsonb not null,
  marked_squares jsonb default '[]',
  score integer default 0,
  bingo_count integer default 0,
  blackout boolean default false,
  joined_at timestamptz default now()
);

-- Marks table (for live feed and replay)
create table marks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  phrase text not null,
  marked_at timestamptz default now(),
  points_awarded integer default 0,
  streak_count integer default 0
);

-- Enable realtime on all three tables
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table marks;

-- Indexes
create index on players(session_id);
create index on marks(session_id);
create index on marks(player_id);
