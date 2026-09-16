-- Hosted Supabase Storage. The offline database has no Storage service.
do $storage$
begin
  if to_regclass('storage.buckets') is null then
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('public-assets', 'public-assets', true, 10485760, array['image/*'])
  on conflict (id) do nothing;
  create policy "Public assets admin manage"
    on storage.objects for all to authenticated
    using (
      bucket_id = 'public-assets'
      and (select private.current_staff_role()) = 'global_admin'
      and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false)
    )
    with check (
      bucket_id = 'public-assets'
      and (select private.current_staff_role()) = 'global_admin'
      and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false)
    );
end
$storage$;
