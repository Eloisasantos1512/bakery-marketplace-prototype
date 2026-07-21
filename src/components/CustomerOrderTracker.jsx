import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import {
  ClipboardList,
  Blend,
  Hand,
  Timer,
  Flame,
  PackageCheck,
  Truck,
  Phone,
  MessageCircle,
  Check,
  Wheat,
} from "lucide-react";

// Lazy: mapbox-gl é uma lib pesada (~600KB). Só carrega quando o pedido
// realmente chega em "Left for Delivery" — o cliente acompanhando as
// etapas de produção (que são a maioria do tempo) nunca paga esse custo.
const DeliveryMap = lazy(() => import("./DeliveryMap"));

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION NOTES (replace the mock block below in production)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   import { createClient } from '@supabase/supabase-js'
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *
 *   // 1. Fetch the order + items once on mount
 *   const { data: order } = await supabase
 *     .from('orders')
 *     .select('*, order_items(*, products(name, unit)), profiles!orders_driver_id_fkey(full_name, phone)')
 *     .eq('id', orderId)
 *     .single()
 *
 *   // 2. Subscribe to live status changes
 *   supabase
 *     .channel(`order-${orderId}`)
 *     .on('postgres_changes',
 *       { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
 *       (payload) => setOrder((prev) => ({ ...prev, ...payload.new }))
 *     )
 *     .subscribe()
 * ─────────────────────────────────────────────────────────────────────────
 */

const STAGES = [
  { key: "placed", label: "Pedido Colocado", icon: ClipboardList },
  { key: "mixing", label: "Mixando Massas", icon: Blend },
  { key: "shaping", label: "Shaping", icon: Hand },
  { key: "proofing", label: "Proofing", icon: Timer },
  { key: "baking", label: "Baking", icon: Flame },
  { key: "packing", label: "Packing", icon: PackageCheck },
  { key: "delivery", label: "Left for Delivery", icon: Truck },
];

const MOCK_ORDER = {
  order_number: "ORD-20260715-4F9A2C",
  created_at: "2026-07-15T07:12:00Z",
  status_index: 3, // proofing
  items: [
    { name: "Sourdough Batards", qty: "40 un" },
    { name: "Croissant Dough Blocks", qty: "12 kg" },
    { name: "Rye Flour, Type 130", qty: "25 kg" },
  ],
  driver: { name: "Marcos Silva", phone: "+55 19 99123-4567" },
};

function timeAgo(index, currentIndex) {
  if (index > currentIndex) return null;
  const mins = (currentIndex - index) * 22 + 4;
  return `${mins}m ago`;
}

export default function CustomerOrderTracker({ approvalStatus = "approved" }) {
  const [order, setOrder] = useState(MOCK_ORDER);
  const currentIndex = order.status_index;

  // Demo-only: pulse animation tick for the active stage
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const progressPct = useMemo(
    () => (currentIndex / (STAGES.length - 1)) * 100,
    [currentIndex]
  );

  const advanceStage = () =>
    setOrder((prev) => ({
      ...prev,
      status_index: Math.min(prev.status_index + 1, STAGES.length - 1),
    }));
  const resetStage = () => setOrder((prev) => ({ ...prev, status_index: 0 }));

  if (approvalStatus === "pending") {
    return <PendingApprovalCard />;
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, #F1E7CE 0%, #E8DBBE 45%, #DFCFA9 100%)",
        fontFamily: "'Inter', ui-sans-serif, system-ui",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
        .kraft-grain {
          background-image: repeating-linear-gradient(
            45deg, rgba(43,38,32,0.025) 0px, rgba(43,38,32,0.025) 1px,
            transparent 1px, transparent 5px
          );
        }
      `}</style>

      <div className="w-full max-w-lg">
        {/* Ticket header */}
        <div
          className="relative rounded-t-2xl px-6 pt-6 pb-8 kraft-grain"
          style={{ background: "#2B2620", color: "#F2EDE3" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wheat size={18} style={{ color: "#C99A2E" }} strokeWidth={2.2} />
            <span className="text-xs tracking-[0.2em] uppercase opacity-70">
              Ticket de Produção
            </span>
          </div>
          <h1 className="ticket-font text-3xl sm:text-4xl font-extrabold leading-none tracking-tight">
            {STAGES[currentIndex].label}
          </h1>
          <div className="mt-3 flex items-center justify-between mono-font text-xs opacity-80">
            <span>#{order.order_number}</span>
            <span>
              Etapa {currentIndex + 1} de {STAGES.length}
            </span>
          </div>
        </div>

        {/* Perforation divider */}
        <div className="relative h-0" style={{ background: "#DFCFA9" }}>
          <div
            className="absolute left-0 right-0 -top-3 h-6 flex items-center"
            style={{ background: "#2B2620" }}
          >
            <div
              className="w-full border-t-2 border-dashed mx-6"
              style={{ borderColor: "#4A4237" }}
            />
          </div>
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute -top-[6px] w-3 h-3 rounded-full"
              style={{
                left: `${(i / 13) * 100}%`,
                background: "#DFCFA9",
                transform: "translateX(-50%)",
              }}
            />
          ))}
        </div>

        {/* Stage rail */}
        <div
          className="px-6 sm:px-8 py-8 rounded-b-2xl shadow-xl"
          style={{ background: "#FAF6EC" }}
        >
          <div className="relative pl-2">
            {/* connecting line */}
            <div
              className="absolute left-[27px] top-2 bottom-2 w-[3px] rounded-full"
              style={{ background: "#E4D6B4" }}
            />
            <div
              className="absolute left-[27px] top-2 w-[3px] rounded-full transition-all duration-700"
              style={{
                background: "#C99A2E",
                height: `calc(${progressPct}% - ${
                  progressPct === 100 ? "8px" : "0px"
                })`,
              }}
            />

            <ul className="space-y-6">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const done = i < currentIndex;
                const active = i === currentIndex;
                const ago = timeAgo(i, currentIndex);

                return (
                  <li key={stage.key} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-2 shrink-0 transition-all duration-300 ${
                        active && pulse ? "scale-105" : "scale-100"
                      }`}
                      style={{
                        background: done ? "#C99A2E" : active ? "#FFF8E8" : "#F1EADA",
                        borderColor: done || active ? "#C99A2E" : "#E4D6B4",
                        boxShadow: active
                          ? "0 0 0 6px rgba(201,154,46,0.15)"
                          : "none",
                      }}
                    >
                      {done ? (
                        <Check size={22} color="#2B2620" strokeWidth={3} />
                      ) : (
                        <Icon
                          size={22}
                          color={active ? "#C99A2E" : "#B3A489"}
                          strokeWidth={2.2}
                        />
                      )}
                    </div>
                    <div className="pt-2.5">
                      <p
                        className={`font-semibold leading-tight ${
                          active ? "text-base" : "text-sm"
                        }`}
                        style={{ color: active ? "#2B2620" : done ? "#5A5142" : "#B3A489" }}
                      >
                        {i + 1}. {stage.label}
                      </p>
                      {ago && (
                        <p className="mono-font text-[11px] mt-0.5" style={{ color: "#B3A489" }}>
                          {active ? "em andamento" : ago}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Order items summary */}
          <div className="mt-8 pt-5" style={{ borderTop: "1px dashed #E4D6B4" }}>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: "#8A7C60" }}>
              Itens do pedido
            </p>
            <ul className="space-y-1.5">
              {order.items.map((item) => (
                <li key={item.name} className="flex justify-between text-sm" style={{ color: "#4A4237" }}>
                  <span>{item.name}</span>
                  <span className="mono-font" style={{ color: "#8A7C60" }}>{item.qty}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Driver tracking — appears once "Left for Delivery" */}
          {currentIndex === STAGES.length - 1 && (
            <div className="mt-6">
              <Suspense
                fallback={
                  <div
                    className="rounded-xl flex items-center justify-center text-sm"
                    style={{ height: 280, background: "#F1EADA", color: "#8A7C60" }}
                  >
                    Carregando mapa...
                  </div>
                }
              >
                <DeliveryMap driverId={order.driver.id} driverName={order.driver.name} />
              </Suspense>
              <div
                className="mt-2 rounded-xl p-3 flex items-center justify-between gap-3"
                style={{ background: "#2B2620" }}
              >
                <p className="text-sm font-semibold" style={{ color: "#F2EDE3" }}>
                  Fale com {order.driver.name}
                </p>
                <div className="flex gap-2">
                  <a
                    href={`tel:${order.driver.phone}`}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-105"
                    style={{ background: "#C99A2E" }}
                    aria-label="Ligar para o motorista"
                  >
                    <Phone size={17} color="#2B2620" strokeWidth={2.3} />
                  </a>
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-transform hover:scale-105"
                    style={{ background: "#4A4237" }}
                    aria-label="Chat com o motorista"
                  >
                    <MessageCircle size={17} color="#F2EDE3" strokeWidth={2.3} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demo controls — not part of production UI */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <span className="opacity-50" style={{ color: "#4A4237" }}>Demo:</span>
          <button
            onClick={advanceStage}
            disabled={currentIndex === STAGES.length - 1}
            className="px-3 py-1.5 rounded-full font-medium disabled:opacity-40"
            style={{ background: "#2B2620", color: "#F2EDE3" }}
          >
            Avançar etapa →
          </button>
          <button
            onClick={resetStage}
            className="px-3 py-1.5 rounded-full font-medium border"
            style={{ borderColor: "#8A7C60", color: "#4A4237" }}
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingApprovalCard() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: "#E8DBBE", fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
      `}</style>
      <div className="max-w-sm w-full rounded-2xl p-7 text-center shadow-xl" style={{ background: "#FAF6EC" }}>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#2B2620" }}
        >
          <Wheat size={26} color="#C99A2E" />
        </div>
        <h2
          className="text-2xl font-extrabold mb-2"
          style={{ fontFamily: "'Big Shoulders Display', sans-serif", color: "#2B2620" }}
        >
          Conta em análise
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6B6350" }}>
          Sua conta está sendo revisada pela nossa equipe. Isso costuma levar até 1 dia útil.
          Enquanto isso, fale com seu representante comercial:
        </p>
        <div className="rounded-xl p-4" style={{ background: "#F1EADA" }}>
          <p className="font-semibold" style={{ color: "#2B2620" }}>Ana Beatriz Costa</p>
          <p className="text-sm mono-font" style={{ color: "#8A7C60" }}>+55 19 98765-4321</p>
          <a
            href="tel:+5519987654321"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#C99A2E", color: "#2B2620" }}
          >
            <Phone size={14} /> Ligar agora
          </a>
        </div>
      </div>
    </div>
  );
}
