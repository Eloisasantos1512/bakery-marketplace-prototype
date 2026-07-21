import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Wheat, Users, Package, Truck, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/admin/aprovacoes", label: "Aprovações", icon: Users },
  { to: "/admin/pedidos", label: "Tracking de Pedidos", icon: Package },
  { to: "/admin/motoristas", label: "Motoristas", icon: Truck },
  { to: "/admin/relatorios", label: "Relatórios de Vendas", icon: BarChart3 },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: "#1C1A17", color: "#F2EDE3", fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
      `}</style>

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

        <nav className="space-y-1 flex-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "text-[#F2EDE3]" : "text-[#9A8E78]"
                  }`
                }
                style={({ isActive }) => ({ background: isActive ? "#34302A" : "transparent" })}
              >
                <Icon size={16} strokeWidth={2.2} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 pt-4" style={{ borderTop: "1px solid #34302A" }}>
          <p className="text-xs font-medium truncate">{profile?.full_name ?? profile?.email}</p>
          <p className="text-[11px] mb-3" style={{ color: "#9A8E78" }}>Administrador</p>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "#2A211F", color: "#C97B6C" }}
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
