-- ==============================================================================
-- FS VISUALS - VISITOR TELEMETRY & ANALYTICS SCHEMA
-- RUN THIS IN SUPABASE SQL EDITOR (Project -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- Enable UUID extension if not enabled
create extension if not exists "pgcrypto";

-- 1. VISITOR PROFILES (Unique visitors, geo, device, bot flags, dwell records)
create table if not exists public.analytics_visitors (
    visitor_id text primary key,
    first_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    visit_count integer default 1 not null,
    country text default 'Unknown',
    city text default 'Unknown',
    region text default 'Unknown',
    ip text,
    device text default 'Desktop',
    browser text default 'Browser',
    os text default 'OS',
    referrer text default 'Direct',
    is_bot boolean default false,
    bot_type text,
    visitor_name text
);

-- 2. VISIT LOGS (Exact page visits with timestamps for session timelines)
create table if not exists public.analytics_visit_logs (
    id uuid primary key default gen_random_uuid(),
    visitor_id text references public.analytics_visitors(visitor_id) on delete cascade,
    visited_at timestamp with time zone default timezone('utc'::text, now()) not null,
    path text default '/',
    country text,
    city text,
    ip text
);

-- 3. USER INTERACTION & TELEMETRY EVENTS (CTA clicks, section views, human verify, heartbeats)
create table if not exists public.analytics_events (
    id uuid primary key default gen_random_uuid(),
    visitor_id text references public.analytics_visitors(visitor_id) on delete cascade,
    event_name text not null,
    event_data jsonb default '{}'::jsonb,
    path text default '/',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CONTACT INQUIRIES & DIRECT WEDDING LEADS
create table if not exists public.contact_inquiries (
    id uuid primary key default gen_random_uuid(),
    visitor_id text references public.analytics_visitors(visitor_id) on delete set null,
    name text not null,
    email text not null,
    phone text,
    event_date text,
    subject text default 'Wedding Photography Inquiry',
    message text,
    country text,
    city text,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for lightning fast queries and dashboard performance
create index if not exists idx_analytics_visitors_last_seen on public.analytics_visitors(last_seen desc);
create index if not exists idx_analytics_visitors_first_seen on public.analytics_visitors(first_seen desc);
create index if not exists idx_analytics_visitors_country on public.analytics_visitors(country);
create index if not exists idx_analytics_visitors_is_bot on public.analytics_visitors(is_bot);
create index if not exists idx_analytics_visit_logs_visited_at on public.analytics_visit_logs(visited_at desc);
create index if not exists idx_analytics_visit_logs_visitor_id on public.analytics_visit_logs(visitor_id);
create index if not exists idx_analytics_events_visitor_id on public.analytics_events(visitor_id);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_contact_inquiries_created_at on public.contact_inquiries(created_at desc);
create index if not exists idx_contact_inquiries_visitor_id on public.contact_inquiries(visitor_id);

-- Enable Row Level Security (RLS)
alter table public.analytics_visitors enable row level security;
alter table public.analytics_visit_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.contact_inquiries enable row level security;

-- Drop existing policies if any to prevent duplication conflicts
drop policy if exists "Allow Public Track Visitors Insert" on public.analytics_visitors;
drop policy if exists "Allow Public Track Visitors Update" on public.analytics_visitors;
drop policy if exists "Allow Public Track Visitors Select" on public.analytics_visitors;
drop policy if exists "Allow Authenticated Full Access Visitors" on public.analytics_visitors;

drop policy if exists "Allow Public Insert Visit Logs" on public.analytics_visit_logs;
drop policy if exists "Allow Public Select Visit Logs" on public.analytics_visit_logs;
drop policy if exists "Allow Authenticated Full Access Visit Logs" on public.analytics_visit_logs;

drop policy if exists "Allow Public Insert Events" on public.analytics_events;
drop policy if exists "Allow Public Select Events" on public.analytics_events;
drop policy if exists "Allow Authenticated Full Access Events" on public.analytics_events;

drop policy if exists "Allow Public Submit Inquiries" on public.contact_inquiries;
drop policy if exists "Allow Authenticated Full Access Contact Inquiries" on public.contact_inquiries;

-- Public Access Policies (For website tracking script and contact form)
create policy "Allow Public Track Visitors Insert" on public.analytics_visitors for insert with check (true);
create policy "Allow Public Track Visitors Update" on public.analytics_visitors for update using (true);
create policy "Allow Public Track Visitors Select" on public.analytics_visitors for select using (true);

create policy "Allow Public Insert Visit Logs" on public.analytics_visit_logs for insert with check (true);
create policy "Allow Public Select Visit Logs" on public.analytics_visit_logs for select using (true);

create policy "Allow Public Insert Events" on public.analytics_events for insert with check (true);
create policy "Allow Public Select Events" on public.analytics_events for select using (true);

create policy "Allow Public Submit Inquiries" on public.contact_inquiries for insert with check (true);

-- Authenticated Admin Access Policies (For Admin Analytics Dashboard & Inbox)
create policy "Allow Authenticated Full Access Visitors" on public.analytics_visitors for all using (auth.role() = 'authenticated');
create policy "Allow Authenticated Full Access Visit Logs" on public.analytics_visit_logs for all using (auth.role() = 'authenticated');
create policy "Allow Authenticated Full Access Events" on public.analytics_events for all using (auth.role() = 'authenticated');
create policy "Allow Authenticated Full Access Contact Inquiries" on public.contact_inquiries for all using (auth.role() = 'authenticated');

