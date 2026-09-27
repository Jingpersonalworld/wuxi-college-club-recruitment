-- Run in the Supabase SQL editor before launching the app.
create extension if not exists pgcrypto;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'reviewer')),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text not null,
  description text not null,
  requirements text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  start_at timestamptz not null,
  deadline_at timestamptz not null,
  created_by uuid references public.admin_users(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_dates check (deadline_at > start_at)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  tracking_no text not null unique,
  query_token_hash text not null,
  name text not null,
  phone text not null,
  email text not null,
  school text not null,
  major text not null default '',
  grade text not null default '',
  introduction text not null default '',
  motivation text not null default '',
  portfolio_url text,
  consent_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'screening', 'reviewing', 'passed', 'pending', 'rejected', 'closed')),
  public_note text not null default '',
  admin_note text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index submissions_project_time on public.submissions(project_id, submitted_at desc);
create index submissions_status on public.submissions(status);

create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind text not null check (kind in ('resume', 'portfolio')),
  original_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size integer not null,
  uploaded_at timestamptz,
  created_at timestamptz not null default now()
);
create index submission_files_submission on public.submission_files(submission_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  reviewer_id uuid not null references public.admin_users(user_id),
  score integer not null check (score between 1 and 5),
  comment text not null default '',
  review_status text not null check (review_status in ('in_progress', 'completed')),
  decision text not null check (decision in ('pass', 'hold', 'reject')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, reviewer_id)
);

create table public.submission_status_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  from_status text,
  to_status text not null,
  public_note text not null default '',
  changed_by uuid references public.admin_users(user_id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users(user_id),
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.submission_rate_limits (
  rate_key text not null,
  hour_bucket timestamptz not null,
  attempts integer not null default 1,
  primary key (rate_key, hour_bucket)
);

create or replace function public.allow_submission_attempt(p_rate_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare current_count integer;
begin
  insert into public.submission_rate_limits (rate_key, hour_bucket, attempts)
  values (p_rate_key, date_trunc('hour', now()), 1)
  on conflict (rate_key, hour_bucket)
  do update set attempts = public.submission_rate_limits.attempts + 1
  returning attempts into current_count;
  return current_count <= 12;
end;
$$;
revoke all on function public.allow_submission_attempt(text) from public, anon, authenticated;
grant execute on function public.allow_submission_attempt(text) to service_role;

create or replace function public.finish_submission(p_submission_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare target_id uuid;
begin
  update public.submissions as s
  set status = 'submitted', submitted_at = now(), updated_at = now()
  from public.projects as p
  where s.id = p_submission_id and s.project_id = p.id
    and s.status = 'draft' and p.status = 'published'
    and now() between p.start_at and p.deadline_at
  returning s.id into target_id;
  if target_id is null then return false; end if;
  insert into public.submission_status_history (submission_id, from_status, to_status)
  values (target_id, 'draft', 'submitted');
  return true;
end;
$$;
revoke all on function public.finish_submission(uuid) from public, anon, authenticated;
grant execute on function public.finish_submission(uuid) to service_role;

create or replace function public.change_submission_status(
  p_submission_id uuid, p_status text, p_public_note text, p_admin_note text, p_actor uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare previous_status text;
begin
  select status into previous_status from public.submissions
  where id = p_submission_id and status <> 'draft' for update;
  if previous_status is null then return false; end if;
  update public.submissions set status = p_status, public_note = p_public_note,
    admin_note = p_admin_note, updated_at = now() where id = p_submission_id;
  insert into public.submission_status_history
    (submission_id, from_status, to_status, public_note, changed_by)
  values (p_submission_id, previous_status, p_status, p_public_note, p_actor);
  insert into public.audit_logs (user_id, action, resource_type, resource_id)
  values (p_actor, 'status.change', 'submission', p_submission_id);
  return true;
end;
$$;
revoke all on function public.change_submission_status(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.change_submission_status(uuid, text, text, text, uuid) to service_role;

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;
alter table public.reviews enable row level security;
alter table public.submission_status_history enable row level security;
alter table public.audit_logs enable row level security;
alter table public.submission_rate_limits enable row level security;

-- The service-role client, used only by server route handlers, bypasses RLS.
-- Browser clients cannot query application tables directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
