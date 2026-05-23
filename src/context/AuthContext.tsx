// src/context/AuthContext.tsx
// ─── Contexto de autenticación ────────────────────────────────────────────────
// Provee: usuario actual, perfil, funciones de auth, y loading state.
// Envuelve toda la app en main.tsx para que cualquier componente pueda
// llamar useAuth() sin prop drilling.

import React, {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserProfile } from "../lib/database.types";

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface AuthContextValue {
  // Estado
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;         // true mientras se verifica la sesión inicial
  profileLoading: boolean;  // true mientras se carga el perfil tras login

  // Acciones
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading]             = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Carga el perfil extendido desde user_profiles
  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found (usuario nuevo sin perfil aún)
      console.error("Error cargando perfil:", error.message);
    }
    setProfile(data ?? null);
    setProfileLoading(false);
  }, []);

  // Escucha cambios de sesión: login, logout, token refresh
  useEffect(() => {
    // Sesión inicial (puede venir de localStorage si la guardó Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    // Suscripción a cambios futuros
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Registro ────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },   // metadata en auth.users
      },
    });

    if (!error && data.user) {
      // Crear fila inicial en user_profiles
      // (el trigger en Supabase podría hacer esto automáticamente,
      //  pero lo hacemos aquí para mayor control desde el frontend)
      const { error: insertError } = await supabase.from("user_profiles").insert({
        id: data.user.id,
        full_name: fullName,
        streak_days: 0,
      } as any); // Type cast necesario porque Insert omite ciertos campos
      if (insertError) console.error("Error creando perfil:", insertError.message);
    }

    return { error };
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // ── Actualizar perfil ───────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No hay usuario autenticado") };

    const { error } = await supabase
      .from("user_profiles")
      .update({ ...updates } as any)
      .eq("id", user.id);

    if (!error) await loadProfile(user.id);
    return { error: error ? new Error(error.message) : null };
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading, profileLoading,
      signUp, signIn, signOut, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
