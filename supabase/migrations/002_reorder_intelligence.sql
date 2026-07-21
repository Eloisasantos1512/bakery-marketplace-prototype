-- ============================================================================
-- Reorder Intelligence — recency/frequency purchase patterns
-- No ML, no external model: pure SQL aggregation over orders/order_items.
-- Run after 001_init_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Raw interval-per-purchase (helper view)
--    For every (customer, product) pair, how many days since the previous
--    time they bought it.
-- ----------------------------------------------------------------------------
create or replace view public.customer_product_intervals
with (security_invoker = true) as
select
  o.customer_id,
  oi.product_id,
  o.created_at,
  oi.quantity,
  o.created_at - lag(o.created_at) over (
    partition by o.customer_id, oi.product_id order by o.created_at
  ) as interval_since_prev
from public.orders o
join public.order_items oi on oi.order_id = o.id
where o.status <> 'cancelled';

-- ----------------------------------------------------------------------------
-- 2. Aggregated pattern per (customer, product): how often, how much,
--    when last bought.
-- ----------------------------------------------------------------------------
create or replace view public.customer_product_patterns
with (security_invoker = true) as
select
  customer_id,
  product_id,
  count(*)                                                     as order_count,
  max(created_at)                                               as last_ordered_at,
  round(avg(quantity), 2)                                       as avg_quantity,
  round(avg(extract(epoch from interval_since_prev) / 86400)::numeric, 1) as avg_interval_days
from public.customer_product_intervals
group by customer_id, product_id;

-- ----------------------------------------------------------------------------
-- 3. get_reorder_suggestions(customer_id)
--    "You usually reorder this every N days — you're due." One RPC call,
--    powers the "Repetir pedido" card in the customer app.
-- ----------------------------------------------------------------------------
create or replace function public.get_reorder_suggestions(p_customer_id uuid)
returns table (
  product_id         uuid,
  product_name       text,
  unit               text,
  suggested_quantity numeric,
  last_ordered_at    timestamptz,
  days_since_last    integer,
  avg_interval_days  numeric,
  days_overdue       integer,
  confidence         text
)
language sql
stable
as $$
  select
    cpp.product_id,
    p.name,
    p.unit,
    cpp.avg_quantity,
    cpp.last_ordered_at,
    extract(day from now() - cpp.last_ordered_at)::int as days_since_last,
    cpp.avg_interval_days,
    (extract(day from now() - cpp.last_ordered_at) - cpp.avg_interval_days)::int as days_overdue,
    case
      when cpp.order_count >= 5 then 'alta'
      when cpp.order_count >= 3 then 'media'
      else 'baixa'
    end as confidence
  from public.customer_product_patterns cpp
  join public.products p on p.id = cpp.product_id
  where cpp.customer_id = p_customer_id
    and cpp.order_count >= 2                                  -- histórico mínimo
    and cpp.avg_interval_days is not null
    and extract(day from now() - cpp.last_ordered_at) >= cpp.avg_interval_days * 0.8
  order by days_overdue desc nulls last;
$$;

grant execute on function public.get_reorder_suggestions(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. account_health_alerts
--    Same underlying data, viewed from the sales-rep side: which accounts
--    have gone quiet relative to their own historical rhythm.
--    Feeds a "check in with this customer" alert — this is the piece an
--    N8N workflow or Edge Function would poll and push to Slack/CRM.
-- ----------------------------------------------------------------------------
create or replace view public.account_health_alerts
with (security_invoker = true) as
select
  cpp.customer_id,
  pr.company_name,
  pr.sales_rep_phone,
  count(*) filter (
    where extract(day from now() - cpp.last_ordered_at) > cpp.avg_interval_days * 1.5
  ) as products_overdue,
  max(
    (extract(day from now() - cpp.last_ordered_at) - cpp.avg_interval_days)::int
  ) as max_days_overdue
from public.customer_product_patterns cpp
join public.profiles pr on pr.id = cpp.customer_id
where cpp.order_count >= 3
group by cpp.customer_id, pr.company_name, pr.sales_rep_phone
having count(*) filter (
  where extract(day from now() - cpp.last_ordered_at) > cpp.avg_interval_days * 1.5
) > 0
order by max_days_overdue desc nulls last;

-- Note: no separate RLS policy needed — `security_invoker` views inherit the
-- RLS of the underlying `orders` / `profiles` tables automatically:
--   • a customer querying this view only ever sees their own row
--   • an admin (via is_admin()) sees every account
