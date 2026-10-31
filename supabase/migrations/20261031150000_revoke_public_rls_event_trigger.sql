-- Keep the RLS auto-enable event trigger internal.
-- Event triggers execute as their owner; API roles must not invoke the function directly.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
