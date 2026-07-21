import React, { useState } from "react";
import { TrendingUp, Package, Users } from "lucide-react";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * SUPABASE INTEGRATION (replace MOCK_REPORT)
 * ─────────────────────────────────────────────────────────────────────────
 *   const { data, error } = await supabase.rpc('get_sales_report', {
 *     p_date_from: '2026-06-20',
 *     p_date_to: '2026-07-20',
 *   })
 *
 *   // If a non-admin somehow calls this (bug, tampered client, curl),
 *   // the DB function itself raises `access denied` — error.code === '42501'.
 *   // This page never needs to re-check the role; the database already did.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MOCK_REPORT = [
  { day: "2026-07-14", order_count: 12, total_revenue_cents: 428000, new_customers: 1 },
  { day: "2026-07-15", order_count: 9, total_revenue_cents: 315000, new_customers: 0 },
  { day: "2026-07-16", order_count: 14, total_revenue_cents: 502000, new_customers: 2 },
  { day: "2026-07-17", order_count: 11, total_revenue_cents: 389000, new_customers: 0 },
  { day: "2026-07-18", order_count: 16, total_revenue_cents: 571000, new_customers: 1 },
  { day: "2026-07-19", order_count: 7, total_revenue_cents: 241000, new_customers: 0 },
  { day: "2026-07-20", order_count: 13, total_revenue_cents: 447000, new_customers: 3 },
];

const fmtBRL = (cents) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SalesReportsPage() {
  const [report] = useState(MOCK_REPORT);

  const totalRevenue = report.reduce((s, r) => s + r.total_revenue_cents, 0);
  const totalOrders = report.reduce((s, r) => s + r.order_count, 0);
  const totalNewCustomers = report.reduce((s, r) => s + r.new_customers, 0);
  const maxRevenue = Math.max(...report.map((r) => r.total_revenue_cents));

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: "#9A8E78" }}>
        Visível apenas para administradores
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Relatório de Vendas</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={TrendingUp} label="Receita (7 dias)" value={fmtBRL(totalRevenue)} />
        <StatCard icon={Package} label="Pedidos (7 dias)" value={totalOrders} />
        <StatCard icon={Users} label="Novos clientes" value={totalNewCustomers} />
      </div>

      <div className="rounded-xl p-5" style={{ background: "#211E19", border: "1px solid #34302A" }}>
        <p className="text-sm font-medium mb-4">Receita por dia</p>
        <div className="flex items-end gap-2 h-40">
          {report.map((r) => (
            <div key={r.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${(r.total_revenue_cents / maxRevenue) * 100}%`,
                  background: "#C99A2E",
                  minHeight: 4,
                }}
                title={fmtBRL(r.total_revenue_cents)}
              />
              <span className="text-[10px]" style={{ color: "#9A8E78" }}>
                {new Date(r.day + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#211E19", border: "1px solid #34302A" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#34302A" }}>
        <Icon size={16} color="#C99A2E" />
      </div>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[11px] mt-1" style={{ color: "#9A8E78" }}>{label}</p>
      </div>
    </div>
  );
}
