import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, MapPin, ChevronRight } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION (replace MOCK_DELIVERIES)
 * ─────────────────────────────────────────────────────────────────────────
 *   const { data: { user } } = await supabase.auth.getUser();
 *   const { data } = await supabase
 *     .from('orders')
 *     .select('*, profiles!orders_customer_id_fkey(company_name)')
 *     .eq('driver_id', user.id)
 *     .in('status', ['packing', 'delivery'])
 *     .order('created_at')
 * ─────────────────────────────────────────────────────────────────────────
 */

const MOCK_DELIVERIES = [
  {
    id: "ord-1",
    order_number: "ORD-20260720-8B3F1A",
    company_name: "Padaria Bom Grão",
    delivery_address: "Rua das Palmeiras, 210 — Trindade, Florianópolis",
    status: "packing",
    items_summary: "40un Sourdough, 12kg Croissant Dough",
  },
  {
    id: "ord-2",
    order_number: "ORD-20260720-4C1D9E",
    company_name: "Confeitaria Doce Trigo",
    delivery_address: "Av. Beira Mar Norte, 880 — Centro, Florianópolis",
    status: "delivery",
    items_summary: "25kg Farinha 130, 3kg Fermento",
  },
];

const STATUS_LABEL = {
  packing: { text: "Aguardando retirada", color: "#B3892E" },
  delivery: { text: "Em rota", color: "#5B7A52" },
};

export default function DeliveriesPage() {
  const [deliveries] = useState(MOCK_DELIVERIES);
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="ticket-font text-2xl font-extrabold mb-4" style={{ color: "#2B2620" }}>
        Minhas Entregas
      </h1>

      {deliveries.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ background: "#FAF6EC", border: "1px dashed #D9C79E" }}>
          <Package size={24} className="mx-auto mb-2" color="#B3A489" />
          <p className="text-sm" style={{ color: "#8A7C60" }}>Nenhuma entrega atribuída no momento.</p>
        </div>
      )}

      <ul className="space-y-3">
        {deliveries.map((d) => {
          const status = STATUS_LABEL[d.status];
          return (
            <li
              key={d.id}
              onClick={() => navigate(`/entregas/${d.id}`)}
              className="rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: "#FAF6EC", border: "1px solid #E4D6B4" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="mono-font text-xs" style={{ color: "#8A7C60" }}>#{d.order_number}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${status.color}1A`, color: status.color }}
                >
                  {status.text}
                </span>
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: "#2B2620" }}>{d.company_name}</p>
              <p className="text-xs flex items-start gap-1 mb-2" style={{ color: "#8A7C60" }}>
                <MapPin size={12} className="mt-0.5 shrink-0" /> {d.delivery_address}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#B3A489" }}>{d.items_summary}</p>
                <ChevronRight size={16} color="#B3A489" />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
