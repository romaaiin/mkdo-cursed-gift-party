-- Keep the RLS auto-enable event-trigger function inaccessible to API roles.
-- Some Supabase projects provide this helper through project-level bootstrap SQL;
-- tolerate a clean project where it has not been installed.
do $migration$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$migration$;
