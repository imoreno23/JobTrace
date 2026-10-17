-- JobTrace initial multi-tenant data model. Every record belongs to one business.
create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'My Business',
  created_at timestamptz not null default now()
);

create function public.create_business_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.businesses (owner_id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), 'My Business'))
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_business
  after insert on auth.users
  for each row execute procedure public.create_business_for_new_user();

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  type text not null default 'Other',
  status text not null default 'Planned' check (status in ('Planned', 'In Progress', 'Completed')),
  property_address text not null default '',
  start_date date,
  end_date date,
  description text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id),
  foreign key (customer_id, business_id) references public.customers(id, business_id) on delete set null (customer_id)
);

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  project_id uuid not null,
  body text not null,
  created_at timestamptz not null default now(),
  foreign key (project_id, business_id) references public.projects(id, business_id) on delete cascade
);

create table public.project_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  project_id uuid not null,
  object_path text not null unique,
  category text not null default 'During' check (category in ('Before', 'During', 'After')),
  caption text not null default '',
  taken_at date,
  created_at timestamptz not null default now(),
  foreign key (project_id, business_id) references public.projects(id, business_id) on delete cascade
);

create index customers_business_idx on public.customers(business_id);
create index projects_business_status_idx on public.projects(business_id, status);
create index project_notes_project_idx on public.project_notes(project_id, created_at desc);
create index project_photos_project_idx on public.project_photos(project_id, created_at desc);

alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.projects enable row level security;
alter table public.project_notes enable row level security;
alter table public.project_photos enable row level security;

create policy "Owners can read their business" on public.businesses
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners can update their business" on public.businesses
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Business owners can access customers" on public.customers
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

create policy "Business owners can access projects" on public.projects
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

create policy "Business owners can access project notes" on public.project_notes
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

create policy "Business owners can access project photos" on public.project_photos
  for all to authenticated using (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid()))
  );

-- Photos live in a private Storage bucket. Object names start with the project UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-photos', 'project-photos', false, 12582912, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 12582912,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Keep the ownership lookup in a helper so the Storage policy can reference
-- the outer storage.objects.name without colliding with projects.name or businesses.name.
create or replace function public.can_access_project_photo(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.projects as p
    join public.businesses as b on b.id = p.business_id
    where p.id::text = split_part(object_path, '/', 1)
      and b.owner_id = (select auth.uid())
  );
$function$;

revoke all on function public.can_access_project_photo(text) from public, anon, authenticated;
grant execute on function public.can_access_project_photo(text) to authenticated;

create policy "Owners can view their project photo files" on storage.objects
  for select to authenticated using (
    bucket_id = 'project-photos' and public.can_access_project_photo(name)
  );

create policy "Owners can upload their project photo files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'project-photos' and public.can_access_project_photo(name)
  );

create policy "Owners can update their project photo files" on storage.objects
  for update to authenticated using (
    bucket_id = 'project-photos' and public.can_access_project_photo(name)
  ) with check (
    bucket_id = 'project-photos' and public.can_access_project_photo(name)
  );

create policy "Owners can delete their project photo files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'project-photos' and public.can_access_project_photo(name)
  );
