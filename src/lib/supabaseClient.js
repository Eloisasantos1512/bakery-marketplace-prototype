import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingConfig = !supabaseUrl || !supabaseAnonKey;

if (missingConfig) {
  // Não travar o app inteiro por isso — createClient() com URL inválida
  // lança exceção na hora do import e derruba toda a árvore React (tela
  // branca, sem erro visível na tela). Preferível: cair num client "falso"
  // que renderiza normalmente e falha de forma controlada quando algo
  // realmente tentar chamar o Supabase.
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados.\n" +
      "Crie um arquivo .env.local na raiz do projeto (copie de .env.example) com os valores " +
      "do seu projeto Supabase (Project Settings → API). Sem isso, login/dados reais não funcionam " +
      "— mas a interface renderiza normalmente com dados mockados."
  );
}

export const supabase = createClient(
  missingConfig ? "https://placeholder.supabase.co" : supabaseUrl,
  missingConfig ? "placeholder-anon-key" : supabaseAnonKey
);

