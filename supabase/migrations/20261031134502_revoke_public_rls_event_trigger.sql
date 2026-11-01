-- Keep the RLS auto-enable event-trigger function inaccessible to API roles.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
