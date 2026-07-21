import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Wheat, Package, ShoppingBag, RotateCcw, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/pedidos", label: "Meus Pedidos", icon: Package },
  { to: "/catalogo", label: "Catálogo", icon: ShoppingBag },
  { to: "/reposicao", label: "Reposição", icon: RotateCcw },
];

export default function CustomerLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#E8DBBE", fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
      `}</style>

      <header
        className="flex items-center justify-between px-4 sm:px-8 py-3 sticky top-0 z-40"
        style={{ background: "#2B2620" }}
      >
        <div className="flex items-center gap-2">
          <Wheat size={18} color="#C99A2E" />
          <span className="ticket-font text-lg font-extrabold" style={{ color: "#F2EDE3" }}>
            {profile?.company_name ?? "Farinha Marketplace"}
          </span>
        </div>
        <button onClick={signOut} className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#C97B6C" }}>
          <LogOut size={13} /> Sair
        </button>
      </header>

      <nav
        className="flex gap-1 px-4 sm:px-8 py-2 sticky z-30"
        style={{ background: "#DFCFA9", top: "48px" }}
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? "" : "opacity-60"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "#2B2620" : "transparent",
                color: isActive ? "#F2EDE3" : "#2B2620",
              })}
            >
              <Icon size={13} />
              {n.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
