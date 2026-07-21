import React from "react";
import { Package } from "lucide-react";

/**
 * STUB: próxima fase. Aqui entra o board estilo Kanban movendo `orders.status`
 * pelas 7 etapas de produção (mesmo enum usado no CustomerOrderTracker), com
 * drag-and-drop ou um select por card. A leitura já pode usar:
 *
 *   const { data } = await supabase
 *     .from('orders')
 *     .select('*, profiles!orders_customer_id_fkey(company_name)')
 *     .neq('status', 'completed')
 *     .order('created_at')
 *
 * e uma subscription realtime em 'orders' pra refletir mudanças de outros
 * admins em tempo real.
 */
export default function TrackingPage() {
  return (
    <div className="p-5 sm:p-8">
      <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "#9A8E78" }}>
        Visível apenas para administradores
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Tracking de Pedidos</h1>
      <div
        className="rounded-xl p-10 text-center"
        style={{ background: "#211E19", border: "1px dashed #34302A" }}
      >
        <Package size={26} className="mx-auto mb-3" color="#9A8E78" />
        <p className="font-medium">Board de produção — próxima fase</p>
        <p className="text-sm mt-1" style={{ color: "#9A8E78" }}>
          Kanban das 7 etapas (Mixando → Left for Delivery), atualizado em tempo real.
        </p>
      </div>
    </div>
  );
}
