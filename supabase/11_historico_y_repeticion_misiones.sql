-- DEMOSVITA MVP - HISTÓRICO PERSONAL Y MISIONES REPETIBLES
-- Conserva todos los registros existentes y permite varios intentos por misión.

begin;

-- La primera versión solo admitía un reporte por usuario y misión.
alter table public.mission_reports
  drop constraint if exists mission_reports_user_id_mission_id_key;

-- Índices para que el catálogo y el histórico carguen con rapidez.
create index if not exists mission_reports_user_created_idx
  on public.mission_reports (user_id, created_at desc);
create index if not exists mission_reports_user_mission_idx
  on public.mission_reports (user_id, mission_id, created_at desc);
create index if not exists mission_proposals_user_created_idx
  on public.mission_proposals (user_id, created_at desc);

-- Reafirma la protección: cada usuario solo consulta y crea sus propios datos.
alter table public.mission_reports enable row level security;
alter table public.mission_proposals enable row level security;

drop policy if exists "Users read own reports" on public.mission_reports;
create policy "Users read own reports" on public.mission_reports
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own reports" on public.mission_reports;
create policy "Users create own reports" on public.mission_reports
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users read own proposals" on public.mission_proposals;
create policy "Users read own proposals" on public.mission_proposals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users create own proposals" on public.mission_proposals;
create policy "Users create own proposals" on public.mission_proposals
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.mission_reports to authenticated;
grant select, insert on public.mission_proposals to authenticated;

commit;

-- Comprobación: no debe aparecer una restricción UNIQUE para user_id + mission_id.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.mission_reports'::regclass
order by conname;
