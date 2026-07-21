-- ============================================================================
-- B2B Bakery Marketplace — Initial Schema
-- Target: Supabase Postgres
-- Run via: supabase migration new init_schema  ->  paste this file  ->  db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";           -- gen_random_uuid()
create extension if not exists "pg_stat_statements";  -- optional, useful for perf tuning

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'driver', 'customer');
create type public.approval_status as enum ('pending', 'approved', 'rejected');

create type public.order_status as enum (
  'placed',     -- 1. Pedido Colocado
  'mixing',     -- 2. Mixando Massas
  'shaping',    -- 3. Shaping
  'proofing',   -- 4. Proofing
  'baking',     -- 5. Baking
  'packing',    -- 6. Packing
  'delivery',   -- 7. Left for Delivery
  'completed',  -- Delivered & signed off
  'cancelled'
);

-- ----------------------------------------------------------------------------
-- 2. profiles (extends auth.users 1:1)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  company_name     text,                  -- customer's business name (bakery/café)
  phone            text,
  role             public.user_role not null default 'customer',
  status           public.approval_status not null default 'pending',
  sales_rep_name   text,                  -- shown on the "Pending Approval" screen
  sales_rep_phone  text,
  vehicle_info     text,                  -- drivers only: plate / vehicle type
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users entry. Role + status gate app access.';

-- ----------------------------------------------------------------------------
-- 3. vendors / products (supplier catalog, managed by admin)
-- ----------------------------------------------------------------------------
create table public.vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact_email text,
  created_at  timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references public.vendors(id) on delete set null,
  sku         text unique not null,
  name        text not null,
  unit        text not null default 'unit',   -- kg, dozen, tray, etc.
  price_cents integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. orders
-- ----------------------------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text unique not null default to_char(now(), '"ORD-"YYYYMMDD"-"') || substr(gen_random_uuid()::text, 1, 6),
  customer_id      uuid not null references public.profiles(id),
  driver_id        uuid references public.profiles(id),
  status           public.order_status not null default 'placed',
  delivery_address text not null,
  notes            text,
  total_cents      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_driver   on public.orders(driver_id);
create index idx_orders_status   on public.orders(status);

-- ----------------------------------------------------------------------------
-- 5. order_items
-- ----------------------------------------------------------------------------
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    numeric not null check (quantity > 0),
  unit_price_cents integer not null default 0
);

create index idx_order_items_order on public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- 6. order_status_history (audit trail — powers the 7-stage tracker timestamps)
-- ----------------------------------------------------------------------------
create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      public.order_status not null,
  changed_by  uuid references public.profiles(id),
  changed_at  timestamptz not null default now()
);

create index idx_status_history_order on public.order_status_history(order_id);

-- ----------------------------------------------------------------------------
-- 7. delivery_logs (Proof of Delivery)
-- ----------------------------------------------------------------------------
create table public.delivery_logs (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders(id) on delete cascade,
  driver_id       uuid not null references public.profiles(id),
  proof_image_url text not null,
  signature_data  text not null,   -- base64 svg/png from signature-pad
  recipient_name  text,
  completed_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. chat_messages (Customer <-> Driver, and Customer <-> Sales Rep pre-approval)
-- ----------------------------------------------------------------------------
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references public.orders(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index idx_chat_order on public.chat_messages(order_id);

-- ----------------------------------------------------------------------------
-- 9. Triggers: updated_at + auto-log status transitions
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.log_order_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end; $$;

create trigger trg_orders_status_log
  after insert or update of status on public.orders
  for each row execute function public.log_order_status_change();

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, status)
  values (new.id, new.email, 'customer', 'pending');
  return new;
end; $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 10. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.vendors             enable row level security;
alter table public.products            enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_status_history enable row level security;
alter table public.delivery_logs       enable row level security;
alter table public.chat_messages       enable row level security;

-- Helper: is the current user an approved admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- profiles ---------------------------------------------------------------
create policy "profiles: self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: self update (not role/status)" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin full access" on public.profiles
  for all using (public.is_admin());

-- products / vendors (public catalog for approved customers) -------------
create policy "products: approved users read" on public.products
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "products: admin write" on public.products
  for all using (public.is_admin());

create policy "vendors: admin only" on public.vendors
  for all using (public.is_admin());

-- orders -------------------------------------------------------------------
create policy "orders: customer sees own" on public.orders
  for select using (customer_id = auth.uid());

create policy "orders: driver sees assigned" on public.orders
  for select using (driver_id = auth.uid());

create policy "orders: admin sees all" on public.orders
  for all using (public.is_admin());

create policy "orders: customer creates own" on public.orders
  for insert with check (customer_id = auth.uid());

create policy "orders: driver updates status of assigned" on public.orders
  for update using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

-- order_items ----------------------------------------------------------------
create policy "order_items: visible if parent order visible" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.customer_id = auth.uid() or o.driver_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items: admin/customer write" on public.order_items
  for all using (public.is_admin() or exists (
    select 1 from public.orders o where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));

-- delivery_logs ----------------------------------------------------------
create policy "delivery_logs: driver inserts own" on public.delivery_logs
  for insert with check (driver_id = auth.uid());

create policy "delivery_logs: participants read" on public.delivery_logs
  for select using (
    driver_id = auth.uid() or public.is_admin() or
    exists (select 1 from public.orders o where o.id = delivery_logs.order_id and o.customer_id = auth.uid())
  );

-- chat_messages ------------------------------------------------------------
create policy "chat: participants read" on public.chat_messages
  for select using (
    public.is_admin() or sender_id = auth.uid() or
    exists (
      select 1 from public.orders o
      where o.id = chat_messages.order_id
        and (o.customer_id = auth.uid() or o.driver_id = auth.uid())
    )
  );

create policy "chat: participants write" on public.chat_messages
  for insert with check (sender_id = auth.uid());

-- order_status_history: read-only audit trail -------------------------------
create policy "status_history: participants read" on public.order_status_history
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (o.customer_id = auth.uid() or o.driver_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- 11. Realtime: expose orders + chat + status history to Supabase Realtime
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_status_history;
alter publication supabase_realtime add table public.chat_messages;

-- ----------------------------------------------------------------------------
-- 12. Storage buckets (run once — proof-of-delivery photos & signatures)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', true)
on conflict (id) do nothing;

create policy "delivery-proofs: drivers upload" on storage.objects
  for insert with check (
    bucket_id = 'delivery-proofs' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'driver')
  );

create policy "delivery-proofs: public read" on storage.objects
  for select using (bucket_id = 'delivery-proofs');
