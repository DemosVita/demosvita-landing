-- DEMOSVITA MVP - PERMITIR ELIMINAR FOTOGRAFIAS PROPIAS
-- Ejecutar una sola vez en Supabase SQL Editor.
-- No elimina datos: únicamente añade permisos restringidos por propietario.

begin;

grant update (photo_path, answers)
on table public.mission_reports
to authenticated;

drop policy if exists "Users can update own report photos"
on public.mission_reports;

create policy "Users can update own report photos"
on public.mission_reports
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own mission photos"
on storage.objects;

create policy "Users can delete own mission photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
