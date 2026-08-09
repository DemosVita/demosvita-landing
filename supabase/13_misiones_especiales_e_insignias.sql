-- DEMOSVITA - MISIONES ESPECIALES E INSIGNIAS
-- Ejecutar una sola vez en Supabase SQL Editor.
-- No modifica las misiones normales, los reportes existentes ni los XP.

begin;

create table if not exists public.special_missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  event_starts_at timestamptz not null,
  claim_starts_at timestamptz not null,
  claim_ends_at timestamptz not null,
  badge_name text not null,
  badge_image_url text not null,
  cover_image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint special_missions_valid_window check (claim_starts_at <= claim_ends_at)
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  special_mission_id uuid not null references public.special_missions(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  unique (user_id, special_mission_id)
);

create index if not exists user_badges_user_awarded_idx on public.user_badges(user_id, awarded_at desc);
alter table public.special_missions enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "Anyone reads published special missions" on public.special_missions;
create policy "Anyone reads published special missions" on public.special_missions for select to anon, authenticated using (is_published = true);
drop policy if exists "Users read own badges" on public.user_badges;
create policy "Users read own badges" on public.user_badges for select to authenticated using (auth.uid() = user_id);

grant select on public.special_missions to anon, authenticated;
grant select on public.user_badges to authenticated;

create or replace function public.claim_special_mission_badge(special_code text, submitted_answers jsonb)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare target public.special_missions; badge_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into target from public.special_missions where code = special_code and is_published = true;
  if not found then raise exception 'Special mission not found'; end if;
  if now() < target.claim_starts_at then raise exception 'Special mission is not open'; end if;
  if now() > target.claim_ends_at then raise exception 'Special mission is closed'; end if;
  if coalesce(length(trim(submitted_answers->>'location')),0) = 0 or coalesce(length(trim(submitted_answers->>'highlight')),0) = 0 then raise exception 'Missing required answers'; end if;
  insert into public.user_badges(user_id,special_mission_id,answers) values(auth.uid(),target.id,submitted_answers)
  on conflict(user_id,special_mission_id) do nothing returning id into badge_id;
  if badge_id is null then raise exception 'Badge already claimed'; end if;
  return badge_id;
end $$;
revoke all on function public.claim_special_mission_badge(text,jsonb) from public;
grant execute on function public.claim_special_mission_badge(text,jsonb) to authenticated;

insert into public.special_missions(code,title,description,event_starts_at,claim_starts_at,claim_ends_at,badge_name,badge_image_url,cover_image_url,is_published)
values('ESPECIAL_ECLIPSE_2026','El eclipse de 2026','Sal a contemplar el eclipse solar del 12 de agosto y guarda qué sentiste al ver cómo cambiaba la luz sobre el mundo. Usa protección ocular homologada durante toda la observación.','2026-08-12 18:25:00+00','2026-08-12 18:25:00+00','2026-08-13 18:25:00+00','Testigo del Eclipse','/assets/insignias/eclipse-2026.svg','/assets/insignias/eclipse-2026.svg',true)
on conflict(code) do update set title=excluded.title,description=excluded.description,event_starts_at=excluded.event_starts_at,claim_starts_at=excluded.claim_starts_at,claim_ends_at=excluded.claim_ends_at,badge_name=excluded.badge_name,badge_image_url=excluded.badge_image_url,cover_image_url=excluded.cover_image_url,is_published=excluded.is_published;

commit;

select code,title,event_starts_at,claim_starts_at,claim_ends_at,badge_name,is_published from public.special_missions order by event_starts_at;
