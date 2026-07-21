import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Wheat } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    // On success, AuthContext's onAuthStateChange updates session/profile
    // automatically and ProtectedRoute redirects based on role/status.
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ background: "#E8DBBE", fontFamily: "'Inter', ui-sans-serif, system-ui" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-7 shadow-xl"
        style={{ background: "#FAF6EC" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#2B2620" }}>
          <Wheat size={24} color="#C99A2E" />
        </div>
        <h1 className="text-xl font-bold text-center mb-6" style={{ color: "#2B2620" }}>
          Entrar
        </h1>

        <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#F1EADA", color: "#2B2620" }}
        />

        <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#F1EADA", color: "#2B2620" }}
        />

        <div className="text-right mb-4">
          <Link to="/esqueci-senha" className="text-xs font-medium" style={{ color: "#8A7C60" }}>
            Esqueci minha senha
          </Link>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: "#C97B6C" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ background: "#C99A2E", color: "#2B2620" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "#8A7C60" }}>
          Primeira vez aqui? <Link to="/cadastro" className="font-medium" style={{ color: "#2B2620" }}>Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
