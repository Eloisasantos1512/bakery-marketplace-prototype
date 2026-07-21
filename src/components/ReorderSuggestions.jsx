import React, { useState } from "react";
import { RotateCcw, TrendingUp, ShoppingCart, Wheat, Sparkles } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION NOTES (replace MOCK_SUGGESTIONS in production)
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   const { data: suggestions } = await supabase
 *     .rpc('get_reorder_suggestions', { p_customer_id: user.id })
 *
 *   // "Repetir pedido" button:
 *   const addSuggestionToCart = (s) => {
 *     addToCart({ product_id: s.product_id, quantity: s.suggested_quantity })
 *   }
 * ─────────────────────────────────────────────────────────────────────────
 * NOTE: this reads purely from historical order data (recency + frequency
 * per product, computed in SQL). No external model, no cold-start problem —
 * works from the customer's 2nd order onward.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MOCK_SUGGESTIONS = [
  {
    product_id: "p1",
    product_name: "Farinha de Trigo Tipo 130",
    unit: "kg",
    suggested_quantity: 25,
    avg_interval_days: 7,
    days_since_last: 9,
    days_overdue: 2,
    confidence: "alta",
  },
  {
    product_id: "p2",
    product_name: "Fermento Biológico Seco",
    unit: "kg",
    suggested_quantity: 3,
    avg_interval_days: 14,
    days_since_last: 19,
    days_overdue: 5,
    confidence: "alta",
  },
  {
    product_id: "p3",
    product_name: "Manteiga sem Sal, Bloco",
    unit: "kg",
    suggested_quantity: 10,
    avg_interval_days: 10,
    days_since_last: 8,
    days_overdue: -2,
    confidence: "media",
  },
];

const CONFIDENCE_LABEL = {
  alta: { text: "Padrão consistente", color: "#5B7A52" },
  media: { text: "Padrão moderado", color: "#B3892E" },
  baixa: { text: "Poucos dados ainda", color: "#9A8E78" },
};

export default function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
  const [added, setAdded] = useState({});

  const handleAdd = (s) => {
    setAdded((prev) => ({ ...prev, [s.product_id]: true }));
    // production: addSuggestionToCart(s)
  };

  const dueNow = suggestions.filter((s) => s.days_overdue >= 0);

  return (
    <div
      className="w-full max-w-lg mx-auto p-4 sm:p-0"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} style={{ color: "#C99A2E" }} />
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: "#8A7C60" }}>
          Baseado no seu histórico
        </span>
      </div>
      <h2
        className="ticket-font text-2xl sm:text-3xl font-extrabold tracking-tight mb-4"
        style={{ color: "#2B2620" }}
      >
        {dueNow.length > 0 ? "Hora de repor" : "Tudo abastecido"}
      </h2>

      <ul className="space-y-3">
        {suggestions.map((s) => {
          const isAdded = added[s.product_id];
          const isOverdue = s.days_overdue >= 0;
          const conf = CONFIDENCE_LABEL[s.confidence];

          return (
            <li
              key={s.product_id}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{
                background: "#FAF6EC",
                border: isOverdue ? "1px solid #E4D6B4" : "1px solid #EEE7D6",
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ background: isOverdue ? "#2B2620" : "#F1EADA" }}
              >
                <Wheat size={18} color={isOverdue ? "#C99A2E" : "#B3A489"} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight" style={{ color: "#2B2620" }}>
                  {s.product_name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="mono-font text-[11px]" style={{ color: "#8A7C60" }}>
                    {s.suggested_quantity} {s.unit} sugeridos
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: `${conf.color}1A`, color: conf.color }}
                  >
                    {conf.text}
                  </span>
                </div>
                <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "#9A8E78" }}>
                  <TrendingUp size={11} />
                  {isOverdue
                    ? `você costuma repor a cada ${s.avg_interval_days}d — já se passaram ${s.days_since_last}d`
                    : `próxima reposição em ~${Math.max(s.avg_interval_days - s.days_since_last, 0)}d`}
                </p>
              </div>

              <button
                onClick={() => handleAdd(s)}
                disabled={isAdded}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:scale-100"
                style={{
                  background: isAdded ? "#EEE7D6" : "#C99A2E",
                  color: isAdded ? "#8A7C60" : "#2B2620",
                }}
              >
                {isAdded ? (
                  <>
                    <ShoppingCart size={13} /> Adicionado
                  </>
                ) : (
                  <>
                    <RotateCcw size={13} /> Repetir
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] mt-4 text-center" style={{ color: "#B3A489" }}>
        Sugestões calculadas a partir da frequência dos seus próprios pedidos.
      </p>
    </div>
  );
}
