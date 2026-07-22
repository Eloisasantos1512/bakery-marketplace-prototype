import React from "react";
import { Outlet } from "react-router-dom";
import { Wheat, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function DriverLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen w-full" style={{ background: "#E8DBBE", fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .ticket-font { font-family: 'Big Shoulders Display', sans-serif; }
      `}</style>

      <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-40" style={{ background: "#2B2620" }}>
        <div className="flex items-center gap-2">
          <Wheat size={18} color="#C99A2E" />
          <span className="ticket-font text-lg font-extrabold" style={{ color: "#F2EDE3" }}>
            {profile?.full_name ?? "Motorista"}
          </span>
        </div>
        <button onClick={signOut} className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#C97B6C" }}>
          <LogOut size={13} /> Sair
        </button>
      </header>

      <Outlet />
    </div>
  );
}
