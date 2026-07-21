-- ============================================================================
-- Live delivery tracking: driver GPS position + geocoded delivery address
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Coordinates for the delivery address. Geocoded once (Mapbox Geocoding
--    API) when the order is created — cheaper and more reliable than
--    re-geocoding the text address on every map render.
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

-- ----------------------------------------------------------------------------
-- 2. driver_locations — ONE row per driver, continuously upserted. This is
--    current position, not a location history log (keeps the table small
--    and avoids unbounded growth from GPS pings every few seconds). If you
--    need historical routes later for analytics, log to a separate
--    time-series table instead of growing this one.
-- ----------------------------------------------------------------------------
create table public.driver_locations (
  driver_id  uuid primary key references public.profiles(id) on delete cascade,
  order_id   uuid references public.orders(id),   -- which delivery this position belongs to
  latitude   double precision not null,
  longitude  double precision not null,
  heading    numeric,                              -- degrees, for rotating the map marker
  speed      numeric,                               -- m/s, optional (used for ETA smoothing)
  updated_at timestamptz not null default now()
);

create index idx_driver_locations_order on public.driver_locations(order_id);

alter table public.driver_locations enable row level security;

-- Driver writes only their own position
create policy "driver_locations: driver upserts own" on public.driver_locations
  for insert with check (driver_id = auth.uid());

create policy "driver_locations: driver updates own" on public.driver_locations
  for update using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

-- Customer sees a driver's position ONLY while that driver is actively
-- assigned to one of their own orders AND that order is out for delivery —
-- not before dispatch, not after completion, not for other customers' orders.
create policy "driver_locations: customer sees active delivery only" on public.driver_locations
  for select using (
    exists (
      select 1 from public.orders o
      where o.driver_id = driver_locations.driver_id
        and o.customer_id = auth.uid()
        and o.status = 'delivery'
    )
  );

-- Admin sees everyone, for the ops dashboard
create policy "driver_locations: admin sees all" on public.driver_locations
  for select using (public.is_admin());

-- Realtime: this is the whole point — customer/admin subscribe to UPDATEs
alter publication supabase_realtime add table public.driver_locations;
