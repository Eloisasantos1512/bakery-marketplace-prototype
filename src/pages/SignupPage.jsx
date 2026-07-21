import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wheat } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "",
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Vira `raw_user_meta_data` no auth.users; o trigger `handle_new_user`
        // (ver 004_signup_metadata.sql) lê daqui pra popular `profiles`.
        data: {
          company_name: form.company_name,
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // profiles.status já nasce 'pending' via trigger — o AuthContext
    // detecta isso no próximo carregamento de sessão e o ProtectedRoute
    // redireciona pra /pending automaticamente.
    navigate("/pending");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: "#E8DBBE" }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-7 shadow-xl"
        style={{ background: "#FAF6EC" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#2B2620" }}>
          <Wheat size={24} color="#C99A2E" />
        </div>
        <h1 className="text-xl font-bold text-center mb-1" style={{ color: "#2B2620" }}>
          Criar conta
        </h1>
        <p className="text-xs text-center mb-6" style={{ color: "#8A7C60" }}>
          Sua conta fica pendente até aprovação da nossa equipe.
        </p>

        <Field label="Nome da empresa" value={form.company_name} onChange={update("company_name")} required />
        <Field label="Seu nome" value={form.full_name} onChange={update("full_name")} required />
        <Field label="Telefone" value={form.phone} onChange={update("phone")} placeholder="+55 19 99999-9999" />
        <Field label="E-mail" type="email" value={form.email} onChange={update("email")} required />
        <Field label="Senha" type="password" value={form.password} onChange={update("password")} required minLength={8} />

        {error && <p className="text-xs mb-3" style={{ color: "#C97B6C" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 mt-1"
          style={{ background: "#C99A2E", color: "#2B2620" }}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "#8A7C60" }}>
          Já tem conta? <Link to="/login" className="font-medium" style={{ color: "#2B2620" }}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder, minLength }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1" style={{ color: "#6B6350" }}>{label}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: "#F1EADA", color: "#2B2620" }}
      />
    </div>
  );
}
