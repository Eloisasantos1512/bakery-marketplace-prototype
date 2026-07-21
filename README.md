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

## Controle de acesso (Admin vs Cliente)

Duas camadas independentes — **a do banco é a que realmente protege os dados;
a do frontend só organiza a experiência**:

1. **Banco (a barreira real):** RLS em toda tabela, mais funções
   `SECURITY DEFINER` para relatórios administrativos que agregam dados de
   todos os clientes (`get_sales_report`, `get_driver_performance` em
   `003_admin_reports_rbac.sql`). Essas funções verificam `is_admin()`
   explicitamente e lançam erro se quem chamou não for admin — isso vale
   mesmo se alguém chamar a API direto, sem passar pela interface.
2. **Frontend (experiência, não segurança):** `AuthContext` carrega
   `profiles.role` e `profiles.status` uma vez, no login. `ProtectedRoute`
   usa isso pra decidir o que renderizar:
   - não logado → `/login`
   - `status = 'pending'` → `/pending` (contato do representante)
   - `status = 'rejected'` → `/rejected`
   - logado + aprovado, mas role errada pra rota → `/nao-autorizado`

   As rotas ficam em duas árvores completamente separadas — `/admin/*` (papel
   `admin`: aprovações, tracking, motoristas, relatórios) e `/` (papel
   `customer`: pedidos, catálogo, reposição) — cada uma com seu próprio
   layout e menu, então um cliente nunca vê sequer o link pra tela de admin.

**Promovendo seu primeiro admin:** depois de criar sua conta pelo signup
normal (que cai como `customer`/`pending`), rode
`supabase/promote_first_admin.sql` no SQL Editor com seu e-mail.

## Fluxos de autenticação

- `/cadastro` — signup com nome da empresa, contato e telefone. Esses dados
  vão como `options.data` no `supabase.auth.signUp()` e o trigger
  `handle_new_user` (atualizado em `004_signup_metadata.sql`) já popula
  `profiles.company_name`/`full_name`/`phone` automaticamente — sem
  necessidade de um segundo insert manual.
- `/esqueci-senha` → `/redefinir-senha` — fluxo padrão do Supabase Auth
  (`resetPasswordForEmail` + `updateUser`). **Importante:** configure a URL
  de redirect no painel do Supabase em **Authentication → URL Configuration
  → Redirect URLs**, adicionando `<sua-url>/redefinir-senha` (em dev, algo
  como `http://localhost:5173/redefinir-senha` ou a URL do seu Codespace).
  Sem isso, o link do e-mail não redireciona corretamente.

## Tracking de entrega ao vivo (Mapbox)

Depois que o pedido chega em "Left for Delivery", o `CustomerOrderTracker`
troca o card estático de contato do motorista por um mapa ao vivo
(`DeliveryMap.jsx`), com posição animada, rota calculada e ETA em tempo real.

**Por que Mapbox e não Google Maps:** é o padrão de mercado pra tracking de
entrega (usado por DHL, Grubhub, Instacart), tem streaming de dados em tempo
real nativo, e sai bem mais barato em geocodificação e carregamento de mapa
na escala que uma B2B como essa opera — free tier de 50k carregamentos/mês
já cobre o protótipo inteiro e o early-stage.

**Pipeline de dados:**
1. App do motorista chama `navigator.geolocation.watchPosition()` (via o hook
   `useBroadcastLocation.js`) e faz upsert em `driver_locations` a cada ~4s.
2. RLS em `driver_locations` (ver `005_driver_locations.sql`) garante que um
   cliente só enxerga a posição do motorista **enquanto** esse motorista está
   atribuído a um pedido **dele** com status `delivery` — não antes, não
   depois, não de outro cliente.
3. `DeliveryMap.jsx` assina essa tabela via Supabase Realtime, anima o
   marcador suavemente entre posições (em vez de "pular"), e consulta a
   Mapbox Directions API pra desenhar a rota e recalcular o ETA.

**Setup:** crie uma conta em mapbox.com, copie o "Default public token", e
adicione `VITE_MAPBOX_TOKEN` no `.env.local`.

**Performance:** `mapbox-gl` é uma lib pesada (~600KB gzip). `DeliveryMap` é
importado via `React.lazy()` dentro do tracker — só entra no bundle quando o
pedido realmente chega na etapa de entrega, então quem está só acompanhando
a produção (a maior parte do tempo) nunca paga esse custo de carregamento.

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
