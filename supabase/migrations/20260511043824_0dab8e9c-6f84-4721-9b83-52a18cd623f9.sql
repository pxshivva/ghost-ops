
-- enums
create type ghost_category as enum ('Data Wrangling','Manual Reporting','Improvised Approval Workflow','Knowledge Retrieval','System Sync','Other');
create type ghost_status as enum ('detected','acknowledged','in_progress','fixed','false_positive');
create type ghost_source as enum ('detected','reported');
create type signal_source as enum ('calendar','gmail','drive','slack','manual');

-- signals
create table public.signals (
  id uuid primary key default gen_random_uuid(),
  source signal_source not null,
  signal_type text not null,
  title text,
  metadata jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);
create index on public.signals (source);

-- ghost processes
create table public.ghost_processes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category ghost_category not null default 'Other',
  team text,
  hours_per_occurrence numeric not null default 1,
  occurrences_per_month numeric not null default 4,
  people_involved integer not null default 1,
  monthly_hours numeric generated always as (hours_per_occurrence * occurrences_per_month * people_involved) stored,
  monthly_cost numeric not null default 0,
  annual_cost numeric not null default 0,
  confidence text not null default 'medium', -- low | medium | high
  difficulty integer not null default 3,     -- 1..5
  recommendation text,
  recommended_tools text,
  implementation_days numeric default 3,
  status ghost_status not null default 'detected',
  owner text,
  source ghost_source not null default 'detected',
  evidence jsonb not null default '[]'::jsonb,
  signal_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ghost_processes (status);
create index on public.ghost_processes (category);

-- submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_name text not null,
  frequency text not null,
  hours numeric not null,
  people integer not null default 1,
  missing_tool text,
  team text,
  anonymous boolean not null default true,
  reporter_name text,
  ghost_process_id uuid references public.ghost_processes(id) on delete set null,
  created_at timestamptz not null default now()
);

-- settings (singleton)
create table public.settings (
  id integer primary key default 1,
  blended_hourly_rate numeric not null default 75,
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
insert into public.settings (id, blended_hourly_rate) values (1, 75);

-- RLS: open access for the demo (no auth)
alter table public.signals enable row level security;
alter table public.ghost_processes enable row level security;
alter table public.submissions enable row level security;
alter table public.settings enable row level security;

create policy "public read signals" on public.signals for select using (true);
create policy "public write signals" on public.signals for insert with check (true);
create policy "public update signals" on public.signals for update using (true);
create policy "public delete signals" on public.signals for delete using (true);

create policy "public read ghost" on public.ghost_processes for select using (true);
create policy "public write ghost" on public.ghost_processes for insert with check (true);
create policy "public update ghost" on public.ghost_processes for update using (true);
create policy "public delete ghost" on public.ghost_processes for delete using (true);

create policy "public read submissions" on public.submissions for select using (true);
create policy "public write submissions" on public.submissions for insert with check (true);

create policy "public read settings" on public.settings for select using (true);
create policy "public update settings" on public.settings for update using (true);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger ghost_processes_touch before update on public.ghost_processes for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();
