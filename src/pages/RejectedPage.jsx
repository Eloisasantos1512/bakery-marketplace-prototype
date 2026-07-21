import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function RejectedPage() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#E8DBBE" }}>
      <div className="max-w-sm w-full rounded-2xl p-7 text-center shadow-xl" style={{ background: "#FAF6EC" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#2B2620" }}>Cadastro não aprovado</h2>
        <p className="text-sm mb-5" style={{ color: "#6B6350" }}>
          Entre em contato com nossa equipe comercial para mais informações sobre seu cadastro.
        </p>
        <button onClick={signOut} className="text-xs underline" style={{ color: "#9A8E78" }}>
          Sair
        </button>
      </div>
    </div>
  );
}
