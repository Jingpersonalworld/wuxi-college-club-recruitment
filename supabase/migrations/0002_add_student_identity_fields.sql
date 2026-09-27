-- Preserve existing submissions while storing campus-specific identity fields for new applications.
alter table public.submissions
  add column if not exists student_id text not null default '',
  add column if not exists college text not null default '',
  add column if not exists class_name text not null default '';

