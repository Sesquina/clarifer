import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";
import {
  UserRole,
  DISCLAIMER_VERSION,
  extractRoleFromUserRecord,
  shouldShowDisclaimer,
} from "./auth-logic";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  disclaimerAccepted: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<{ error: string | null }>;
  acceptDisclaimer: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    disclaimerAccepted: false,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadUserData(session);
        } else {
          setState({
            session: null,
            user: null,
            role: null,
            disclaimerAccepted: false,
            loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(session: Session) {
    const userId = session.user.id;

    const [{ data: userRecord }, { data: acceptance }] = await Promise.all([
      supabase.from("users").select("role, organization_id").eq("id", userId).single(),
      supabase
        .from("medical_disclaimer_acceptances")
        .select("disclaimer_version")
        .eq("user_id", userId)
        .order("accepted_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    setState({
      session,
      user: session.user,
      role: extractRoleFromUserRecord(userRecord),
      disclaimerAccepted: !shouldShowDisclaimer(acceptance),
      loading: false,
    });
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function setRole(role: UserRole) {
    if (!state.user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", state.user.id);
    if (!error) {
      setState((s) => ({ ...s, role }));
    }
    return { error: error?.message ?? null };
  }

  async function acceptDisclaimer() {
    if (!state.user) return { error: "Not authenticated" };
    const { error } = await supabase.from("medical_disclaimer_acceptances").insert({
      user_id: state.user.id,
      disclaimer_version: DISCLAIMER_VERSION,
      platform: "mobile",
    });
    if (!error) {
      setState((s) => ({ ...s, disclaimerAccepted: true }));
    }
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, setRole, acceptDisclaimer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
