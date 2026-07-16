# B2B Bakery Marketplace — Prototype

A niche "iFood-style" B2B marketplace for specialized food/bakery supply chains,
with real-time production tracking and delivery dispatching.

**Stack:** React + Tailwind (frontend) · Supabase — Postgres, Auth, Realtime, Storage (backend)

## Ecosystem

| App | Purpose |
|---|---|
| **Admin/Supplier Console** | Approve/reject signups, manage products/vendors, advance order production stages, assign drivers |
| **Customer App** | Sign up → Pending Approval (shows sales rep contact) → place orders → live 7-stage tracker → contact driver once "Left for Delivery" |
| **Driver App** | Assigned deliveries, routing helper, chat, Proof of Delivery (photo + signature) |

## Order production stages

1. Pedido Colocado
2. Mixando Massas
3. Shaping
4. Proofing
5. Baking
6. Packing
7. Left for Delivery
   → *Completed* (after driver submits Proof of Delivery)

## Repo structure

```
supabase/
  migrations/
    001_init_schema.sql            # full DB schema, RLS, triggers, realtime, storage bucket
    002_reorder_intelligence.sql   # recency/frequency reorder suggestions + account-health view
src/
  components/
    CustomerOrderTracker.jsx      # 7-stage live tracker + pending-approval screen
    AdminApprovalDashboard.jsx    # approval queue console
    ReorderSuggestions.jsx        # "hora de repor" — one-click reorder card
explicacao-cliente-reorder-inteligente.md   # how to pitch the reorder feature to the client
```

## Reorder Intelligence (recency/frequency, no ML)

`002_reorder_intelligence.sql` adds:

- `customer_product_patterns` — a view aggregating, per customer × product, how often
  they buy it (`avg_interval_days`), how much (`avg_quantity`), and when they last did.
- `get_reorder_suggestions(customer_id)` — an RPC the customer app calls to render the
  "Hora de repor" card. Returns products that are statistically overdue based on the
  customer's own ordering rhythm.
- `account_health_alerts` — the same data from the supplier's side: accounts whose buying
  pattern has gone quiet relative to their own history. This is the natural hook for an
  N8N workflow (poll this view → notify the sales rep in Slack/CRM) or, later, an LLM
  summary layer.

No external model, no cold-start problem beyond 2 historical orders per product. See
`explicacao-cliente-reorder-inteligente.md` for the client-facing pitch.

## Getting started

1. **Create a Supabase project** at supabase.com.
2. **Run the migration:**
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   (or paste `supabase/migrations/001_init_schema.sql` directly into the SQL editor)
3. **Enable Realtime** for `orders`, `order_status_history`, and `chat_messages` — the migration already adds them to the `supabase_realtime` publication, but confirm in Database → Replication.
4. **Scaffold the frontend:**
   ```bash
   npm create vite@latest bakery-marketplace -- --template react
   cd bakery-marketplace
   npm install @supabase/supabase-js lucide-react
   npx tailwindcss init -p
   ```
   Copy `src/components/*` into your new project, drop in your Supabase URL/anon key, and swap the mock `useState` data for the Supabase calls documented in the comment block at the top of each component.
5. **Env vars** (`.env.local`, already gitignored):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

## Database schema summary

- `profiles` — extends `auth.users`; `role` (admin/driver/customer) + `status` (pending/approved/rejected) gate access. Auto-created on signup via trigger.
- `vendors`, `products` — supplier catalog.
- `orders`, `order_items` — the core order, with `status` walking through the 7 production stages.
- `order_status_history` — auto-populated audit trail (trigger) that timestamps every stage transition — this is what powers the "Xm ago" labels on the tracker.
- `delivery_logs` — Proof of Delivery (photo URL + signature).
- `chat_messages` — customer↔driver and customer↔sales-rep chat, realtime-enabled.
- Row Level Security is enabled on every table: customers only see their own orders, drivers only see assigned orders, admins see everything.

## Roadmap

See project notes / conversation history for the full 5-phase build plan (Foundations → Customer App → Admin Console → Driver App → Hardening).

## License

Internal prototype — not yet licensed for external distribution.
