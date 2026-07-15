import React, { useState, useMemo } from "react";
import {
  Wheat,
  Check,
  X,
  Search,
  Building2,
  Phone,
  Mail,
  Clock,
  Users,
  Package,
  Truck,
  LayoutGrid,
} from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION NOTES (replace MOCK_PENDING in production)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   const { data: pending } = await supabase
 *     .from('profiles')
 *     .select('*')
 *     .eq('role', 'customer')
 *     .eq('status', 'pending')
 *     .order('created_at', { ascending: true })
 *
 *   // Approve / reject
 *   await supabase.from('profiles')
 *     .update({ status: 'approved' })   // or 'rejected'
 *     .eq('id', profileId)
 *
 *   // Live updates as new signups arrive
 *   supabase.channel('pending-signups')
 *     .on('postgres_changes',
 *       { event: '*', schema: 'public', table: 'profiles', filter: `status=eq.pending` },
 *       (payload) => refetchPending()
 *     ).subscribe()
 * ─────────────────────────────────────────────────────────────────────────
 */

const MOCK_PENDING = [
  {
    id: "1",
    company_name: "Padaria Bom Grão",
    full_name: "Fernanda Lucchesi",
    email: "fernanda@bomgrao.com.br",
    phone: "+55 19 99871-2233",
    created_at: "2026-07-15T09:20:00Z",
  },
  {
    id: "2",
    company_name: "Confeitaria Doce Trigo",
    full_name: "Rodrigo Amaral",
    email: "rodrigo@docetrigo.com",
    phone: "+55 11 98123-4455",
    created_at: "2026-07-14T18:03:00Z",
  },
  {
    id: "3",
    company_name: "Croissanteria Central",
    full_name: "Isabela Nogueira",
    email: "isabela@croissanteria.com",
    phone: "+55 19 97733-8890",
    created_at: "2026-07-14T11:47:00Z",
  },
];

function hoursAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  return h < 1 ? "agora há pouco" : h < 24 ? `há ${h}h` : `há ${Math.floor(h / 24)}d`;
}

const NAV = [
  { key: "pending", label: "Aprovações", icon: Users },
  { key: "orders", label: "Pedidos", icon: Package },
  { key: "drivers", label: "Motoristas", icon: Truck },
  { key: "catalog", label: "Catálogo", icon: LayoutGrid },
];

export default function AdminApprovalDashboard() {
  const [pending, setPending] = useState(MOCK_PENDING);
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("pending");
  const [toast, setToast] = useState(null);

  const filtered = useMemo(
    () =>
      pending.filter((p) =>
        `${p.company_name} ${p.full_name}`.toLowerCase().includes(query.toLowerCase())
      ),
    [pending, query]
  );

  const resolve = (id, decision) => {
    const person = pending.find((p) => p.id === id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    setToast(
      decision === "approved"
        ? `${person.company_name} foi aprovado.`
        : `${person.company_name} foi recusado.`
    );
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: "#1C1A17", color: "#F2EDE3", fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      {/* Sidebar */}
      <aside
        className="hidden sm:flex flex-col w-56 shrink-0 py-6 px-4"
        style={{ background: "#211E19", borderRight: "1px solid #34302A" }}
      >
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#C99A2E" }}>
            <Wheat size={17} color="#1C1A17" strokeWidth={2.3} />
          </div>
          <span className="ticket-font text-lg font-extrabold tracking-tight">Farinha Ops</span>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = activeNav === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setActiveNav(n.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? "#34302A" : "transparent",
                  color: active ? "#F2EDE3" : "#9A8E78",
                }}
              >
                <Icon size={16} strokeWidth={2.2} />
                {n.label}
                {n.key === "pending" && pending.length > 0 && (
                  <span
                    className="ml-auto mono-font text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "#C99A2E", color: "#1C1A17" }}
                  >
                    {pending.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-5 sm:p-8 max-w-4xl mx-auto w-full">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "#9A8E78" }}>
            Console do Fornecedor
          </p>
          <h1 className="ticket-font text-3xl sm:text-4xl font-extrabold tracking-tight">
            Fila de Aprovação
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A8E78" }}>
            Novos clientes B2B aguardando liberação de acesso.
          </p>
        </header>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg mb-5"
          style={{ background: "#211E19", border: "1px solid #34302A" }}
        >
          <Search size={16} color="#9A8E78" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por empresa ou responsável..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-[#9A8E78]"
          />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: "#211E19", border: "1px dashed #34302A" }}
          >
            <Check size={28} className="mx-auto mb-3" color="#6E8C5E" />
            <p className="font-medium">Tudo em dia</p>
            <p className="text-sm mt-1" style={{ color: "#9A8E78" }}>
              Não há novos cadastros aguardando aprovação.
            </p>
          </div>
        )}

        {/* Pending list */}
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="relative rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: "#211E19", border: "1px solid #34302A" }}
            >
              {/* stamp */}
              <span
                className="absolute top-3 right-4 text-[10px] font-bold tracking-widest uppercase mono-font px-2 py-0.5 rounded"
                style={{
                  color: "#C99A2E",
                  border: "1px solid #C99A2E",
                  transform: "rotate(3deg)",
                  opacity: 0.8,
                }}
              >
                Pendente
              </span>

              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#34302A" }}
              >
                <Building2 size={18} color="#C99A2E" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base truncate">{p.company_name}</p>
                <p className="text-sm truncate" style={{ color: "#9A8E78" }}>{p.full_name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: "#9A8E78" }}>
                  <span className="flex items-center gap-1">
                    <Mail size={12} /> {p.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {p.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {hoursAgo(p.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => resolve(p.id, "rejected")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#3A2420]"
                  style={{ background: "#2A211F", color: "#C97B6C", border: "1px solid #3D2C28" }}
                >
                  <X size={14} strokeWidth={2.5} /> Recusar
                </button>
                <button
                  onClick={() => resolve(p.id, "approved")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.03]"
                  style={{ background: "#C99A2E", color: "#1C1A17" }}
                >
                  <Check size={14} strokeWidth={3} /> Aprovar
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Toast */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium shadow-xl"
            style={{ background: "#F2EDE3", color: "#1C1A17" }}
          >
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
