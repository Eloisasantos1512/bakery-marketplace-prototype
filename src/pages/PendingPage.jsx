import React from "react";
import { Wheat, Phone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function PendingPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#E8DBBE" }}>
      <div className="max-w-sm w-full rounded-2xl p-7 text-center shadow-xl" style={{ background: "#FAF6EC" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#2B2620" }}>
          <Wheat size={26} color="#C99A2E" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#2B2620" }}>Conta em análise</h2>
        <p className="text-sm mb-6" style={{ color: "#6B6350" }}>
          Sua conta está sendo revisada pela nossa equipe. Fale com seu representante comercial se precisar de algo enquanto isso:
        </p>
        <div className="rounded-xl p-4" style={{ background: "#F1EADA" }}>
          <p className="font-semibold" style={{ color: "#2B2620" }}>
            {profile?.sales_rep_name ?? "Equipe comercial"}
          </p>
          {profile?.sales_rep_phone && (
            <a
              href={`tel:${profile.sales_rep_phone}`}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: "#C99A2E", color: "#2B2620" }}
            >
              <Phone size={14} /> {profile.sales_rep_phone}
            </a>
          )}
        </div>
        <button onClick={signOut} className="mt-5 text-xs" style={{ color: "#9A8E78" }}>
          Sair
        </button>
      </div>
    </div>
  );
}
