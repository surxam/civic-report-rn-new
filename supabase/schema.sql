-- =========================================================
-- Civic Report — schéma Supabase (PostgreSQL)
-- =========================================================
-- Relations :
--   auth.users (1) ──< profiles (1)
--   profiles   (1) ──< reports  (1) ──< report_images
--                                  └──< report_videos
--   report_categories (1) ──< report_types (1) ──< reports
--
-- "profiles" étend auth.users (fourni nativement par Supabase Auth) au lieu
-- de recréer une table "users" : on évite de dupliquer email/mot de passe.
-- reports.user_id référence profiles.id (== auth.users.id).
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- profils citoyens ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Citoyen',
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------- catégories & types de signalement ----------
create table if not exists public.report_categories (
  id text primary key,             -- ex: 'voirie', 'eclairage'
  label text not null,
  color text not null,             -- clé de couleur (blue, orange, lime, aqua, red, gray)
  icon text not null               -- nom d'icône (Ionicons)
);

create table if not exists public.report_types (
  value text primary key,          -- ex: 'trou_chaussee'
  label text not null,
  category_id text not null references public.report_categories (id) on delete cascade
);

-- ---------- signalements ----------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reference text unique not null default ('RR-' || to_char(now(), 'YYYYMM') || '-' || lpad(floor(random() * 999)::text, 3, '0')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.report_categories (id),
  type_value text not null references public.report_types (value),
  title text not null,
  description text not null check (char_length(description) >= 20),
  address text not null,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- ---------- médias (tables séparées, conformément au MLD d'origine) ----------
create table if not exists public.report_images (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null,      -- chemin dans le bucket Supabase Storage "report-media"
  created_at timestamptz not null default now()
);

create table if not exists public.report_videos (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists report_images_report_id_idx on public.report_images (report_id);
create index if not exists report_videos_report_id_idx on public.report_videos (report_id);

-- =========================================================
-- Trigger : création automatique du profil à l'inscription
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_images enable row level security;
alter table public.report_videos enable row level security;
alter table public.report_categories enable row level security;
alter table public.report_types enable row level security;

-- Catégories/types : lecture publique (référentiel), pas d'écriture côté client
create policy "categories are readable by everyone" on public.report_categories
  for select using (true);
create policy "types are readable by everyone" on public.report_types
  for select using (true);

-- Profils : chacun lit/modifie uniquement le sien
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Rapports : un utilisateur voit et crée uniquement ses propres rapports
create policy "reports: select own" on public.reports
  for select using (auth.uid() = user_id);
create policy "reports: insert own" on public.reports
  for insert with check (auth.uid() = user_id);
create policy "reports: update own" on public.reports
  for update using (auth.uid() = user_id);

-- Médias : accès si le rapport parent appartient à l'utilisateur
create policy "images: select own" on public.report_images
  for select using (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));
create policy "images: insert own" on public.report_images
  for insert with check (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

create policy "videos: select own" on public.report_videos
  for select using (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));
create policy "videos: insert own" on public.report_videos
  for insert with check (exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));

-- =========================================================
-- Données de référence (catégories & types)
-- =========================================================
insert into public.report_categories (id, label, color, icon) values
  ('voirie', 'Voirie', 'blue', 'trail-sign-outline'),
  ('eclairage', 'Éclairage', 'orange', 'bulb-outline'),
  ('proprete', 'Propreté', 'lime', 'trash-outline'),
  ('espaces_verts', 'Espaces verts', 'aqua', 'leaf-outline'),
  ('securite', 'Sécurité', 'red', 'shield-checkmark-outline'),
  ('autre', 'Autre', 'gray', 'ellipsis-horizontal-circle-outline')
on conflict (id) do nothing;

insert into public.report_types (value, label, category_id) values
  ('trou_chaussee', 'Trou dans la chaussée', 'voirie'),
  ('panneau_manquant', 'Panneau manquant ou abîmé', 'voirie'),
  ('eclairage_defaillant', 'Éclairage défaillant', 'eclairage'),
  ('proprete_publique', 'Propreté publique', 'proprete'),
  ('espaces_verts', 'Entretien des espaces verts', 'espaces_verts'),
  ('voiture_abandonnee', 'Voiture abandonnée', 'securite'),
  ('destruction_materiel_public', 'Dégradation de matériel public', 'securite'),
  ('autre', 'Autre problème', 'autre')
on conflict (value) do nothing;

-- =========================================================
-- Storage : bucket pour les photos/vidéos des signalements
-- =========================================================
insert into storage.buckets (id, name, public)
values ('report-media', 'report-media', true)
on conflict (id) do nothing;

create policy "report-media: public read" on storage.objects
  for select using (bucket_id = 'report-media');
create policy "report-media: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'report-media' and auth.role() = 'authenticated');
