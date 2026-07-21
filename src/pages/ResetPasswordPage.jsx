import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wheat } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // O link do e-mail já autentica automaticamente (Supabase processa o
    // token da URL e dispara este evento) — só esperamos isso acontecer
    // antes de liberar o formulário.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // fallback: se a sessão já existir quando o componente montar
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#E8DBBE" }}>
      <div className="w-full max-w-sm rounded-2xl p-7 shadow-xl" style={{ background: "#FAF6EC" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#2B2620" }}>
          <Wheat size={24} color="#C99A2E" />
        </div>

        {!ready && !done && (
          <p className="text-sm text-center" style={{ color: "#6B6350" }}>
            Confirmando o link de redefinição...
          </p>
        )}

        {ready && !done && (
          <form onSubmit={handleSubmit}>
            <h1 className="text-xl font-bold text-center mb-6" style={{ color: "#2B2620" }}>
              Nova senha
            </h1>

            <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>Nova senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "#F1EADA", color: "#2B2620" }}
            />

            <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>Confirmar senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "#F1EADA", color: "#2B2620" }}
            />

            {error && <p className="text-xs mb-3" style={{ color: "#C97B6C" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ background: "#C99A2E", color: "#2B2620" }}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {done && (
          <p className="text-sm text-center" style={{ color: "#5B7A52" }}>
            Senha atualizada! Redirecionando para o login...
          </p>
        )}
      </div>
    </div>
  );
}
