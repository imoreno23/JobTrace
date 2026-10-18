create table if not exists public.project_photo_comparisons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  project_id uuid not null,
  before_photo_id uuid not null,
  after_photo_id uuid not null,
  created_at timestamptz not null default now(),
  unique (project_id),
  foreign key (project_id, business_id) references public.projects(id, business_id) on delete cascade
);

create unique index if not exists project_photos_id_project_idx on public.project_photos(id, project_id);
alter table public.project_photo_comparisons
  add constraint project_photo_comparisons_before_project_fk foreign key (before_photo_id, project_id) references public.project_photos(id, project_id) on delete cascade,
  add constraint project_photo_comparisons_after_project_fk foreign key (after_photo_id, project_id) references public.project_photos(id, project_id) on delete cascade;

alter table public.project_photo_comparisons enable row level security;

create policy "Business owners can access project photo comparisons" on public.project_photo_comparisons
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

create table if not exists public.workspace_activity (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_recent_idx on public.workspace_activity(business_id, created_at desc);
alter table public.workspace_activity enable row level security;
create policy "Business owners can access workspace activity" on public.workspace_activity
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );
