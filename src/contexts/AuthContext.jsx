import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * AuthContext is the single source of truth for "who is this and what can
 * they do". Everything downstream (route guards, nav menus, page content)
 * reads from here instead of re-querying Supabase independently — one
 * fetch, one place that can go stale, one place to fix if the role model
 * changes.
 *
 * profile.role   -> 'admin' | 'driver' | 'customer'
 * profile.status -> 'pending' | 'approved' | 'rejected'
 *
 * Both matter: role decides WHAT you could see, status decides WHETHER
 * you're allowed in at all yet (a customer awaiting approval is role
 * 'customer' but status 'pending' — treated as no real access).
 */

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Falha ao carregar perfil:", error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
  }

  useEffect(() => {
    // 1. Hydrate on first load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    });

    // 2. Keep in sync with login/logout/token refresh
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    isApproved: profile?.status === "approved",
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  }
  return ctx;
}
