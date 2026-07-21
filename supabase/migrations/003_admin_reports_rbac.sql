-- ============================================================================
-- Admin-only reporting layer
-- ============================================================================
-- IMPORTANT PRINCIPLE: frontend route guards only hide UI. The real access
-- control lives here — in the database — because it's enforced no matter
-- how the data is requested (browser, curl, a script, a bug in the React
-- router). Never treat "the customer app doesn't show this screen" as
-- security. This file is the actual lock; the frontend is just the door
-- being politely closed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. get_sales_report(date_from, date_to)
--    Aggregated revenue/order data across ALL customers. A customer's own
--    RLS-scoped queries would never accidentally return this (RLS already
--    restricts orders to `customer_id = auth.uid()`), but because this is a
--    cross-account aggregate, we gate it explicitly and loudly rather than
--    relying on RLS alone — belt and suspenders for anything that touches
--    every customer's data at once.
-- ----------------------------------------------------------------------------
create or replace function public.get_sales_report(
  p_date_from date default (now() - interval '30 days')::date,
  p_date_to   date default now()::date
)
returns table (
  day               date,
  order_count       bigint,
  total_revenue_cents bigint,
  new_customers     bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'access denied: admin role required' using errcode = '42501';
  end if;

  return query
  select
    d::date as day,
    coalesce(o.order_count, 0),
    coalesce(o.total_revenue_cents, 0),
    coalesce(c.new_customers, 0)
  from generate_series(p_date_from, p_date_to, interval '1 day') as d
  left join (
    select
      created_at::date as day,
      count(*) as order_count,
      sum(total_cents) as total_revenue_cents
    from public.orders
    where status <> 'cancelled'
    group by created_at::date
  ) o on o.day = d::date
  left join (
    select
      created_at::date as day,
      count(*) as new_customers
    from public.profiles
    where role = 'customer'
    group by created_at::date
  ) c on c.day = d::date
  order by day;
end;
$$;

-- Explicitly do NOT grant this to `authenticated` broadly — every caller
-- still has to pass the is_admin() check inside the function body, but
-- being deliberate about grants is cheap insurance.
revoke all on function public.get_sales_report(date, date) from public;
grant execute on function public.get_sales_report(date, date) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. get_driver_performance() — another admin-only cross-account aggregate,
--    same pattern. Add future admin-only reports the same way: SECURITY
--    DEFINER function + explicit is_admin() check at the top.
-- ----------------------------------------------------------------------------
create or replace function public.get_driver_performance(
  p_date_from date default (now() - interval '30 days')::date
)
returns table (
  driver_id           uuid,
  driver_name         text,
  deliveries_completed bigint,
  avg_minutes_in_transit numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'access denied: admin role required' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    count(dl.id) as deliveries_completed,
    round(avg(extract(epoch from (dl.completed_at - osh.changed_at)) / 60)::numeric, 1)
  from public.profiles p
  join public.delivery_logs dl on dl.driver_id = p.id
  left join lateral (
    select changed_at
    from public.order_status_history
    where order_id = dl.order_id and status = 'delivery'
    order by changed_at desc
    limit 1
  ) osh on true
  where p.role = 'driver'
    and dl.completed_at >= p_date_from
  group by p.id, p.full_name
  order by deliveries_completed desc;
end;
$$;

revoke all on function public.get_driver_performance(date) from public;
grant execute on function public.get_driver_performance(date) to authenticated;
