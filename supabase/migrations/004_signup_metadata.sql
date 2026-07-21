-- ============================================================================
-- Signup metadata: capture company_name / full_name / phone at signup time
-- ============================================================================
-- The signup form passes these as `options.data` to supabase.auth.signUp(),
-- which Supabase stores on auth.users.raw_user_meta_data. We just need the
-- trigger to read them instead of leaving the columns null.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, status, full_name, company_name, phone)
  values (
    new.id,
    new.email,
    'customer',
    'pending',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end; $$;

-- Trigger already exists from 001_init_schema.sql and points at this same
-- function name, so no need to re-create it — replacing the function body
-- is enough.
