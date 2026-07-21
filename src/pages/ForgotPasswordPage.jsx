import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Wheat, Mail } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // O link do e-mail volta pra essa URL com um token na hash;
    // ResetPasswordPage lê a sessão que o Supabase já cria a partir dele.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#E8DBBE" }}>
      <div className="w-full max-w-sm rounded-2xl p-7 shadow-xl" style={{ background: "#FAF6EC" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#2B2620" }}>
          <Wheat size={24} color="#C99A2E" />
        </div>

        {sent ? (
          <>
            <div className="flex justify-center mb-3">
              <Mail size={28} color="#5B7A52" />
            </div>
            <h1 className="text-lg font-bold text-center mb-2" style={{ color: "#2B2620" }}>
              Verifique seu e-mail
            </h1>
            <p className="text-sm text-center" style={{ color: "#6B6350" }}>
              Enviamos um link de redefinição de senha para <strong>{email}</strong>.
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="text-xl font-bold text-center mb-1" style={{ color: "#2B2620" }}>
              Esqueci minha senha
            </h1>
            <p className="text-xs text-center mb-6" style={{ color: "#8A7C60" }}>
              Enviaremos um link de redefinição para o seu e-mail.
            </p>

            <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <p className="text-xs text-center mt-4" style={{ color: "#8A7C60" }}>
          <Link to="/login" className="font-medium" style={{ color: "#2B2620" }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
