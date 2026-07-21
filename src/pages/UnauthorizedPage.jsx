import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const HOME_BY_ROLE = {
  admin: "/admin/aprovacoes",
  customer: "/pedidos",
  driver: "/entregas",
};

export default function UnauthorizedPage() {
  const { role } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#1C1A17" }}>
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-bold mb-2" style={{ color: "#F2EDE3" }}>Acesso não autorizado</h2>
        <p className="text-sm mb-5" style={{ color: "#9A8E78" }}>
          Sua conta não tem permissão para acessar essa área.
        </p>
        <button
          onClick={() => navigate(HOME_BY_ROLE[role] ?? "/login")}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#C99A2E", color: "#1C1A17" }}
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
