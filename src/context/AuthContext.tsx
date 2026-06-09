// src/context/AuthContext.tsx
import React, {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { UserProfile, LabResultRecord, WeightLogRecord } from "../lib/database.types";

// ─── Tipo para las notas ───────────────────────────────────────────────────────
export interface NutritionistNote {
  id: string;
  user_id: string;
  note_text: string;
  author_name: string;
  note_date: string;
  created_at: string;
}

// ─── Tipos del contexto ───────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileLoadFailed: boolean;

  signUp:        (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn:        (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signOut:       () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;

  // ── Notas del nutricionista ─────────────────────────────────────────────────
  getNotes:   () => Promise<NutritionistNote[]>;
  addNote:    (text: string, author: string) => Promise<{ error: Error | null }>;
  updateNote: (id: string, text: string, author: string) => Promise<{ error: Error | null }>;
  deleteNote: (id: string) => Promise<void>;
  getLabResults: () => Promise<LabResultRecord[]>;
  getWeightLogs: () => Promise<WeightLogRecord[]>;
  logWeight: (weight: number) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]               = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    setProfileLoadFailed(false);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Error cargando perfil:", error.message);
      setProfileLoadFailed(true);
    }
    setProfile(data ?? null);
    setProfileLoading(false);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await loadProfile(session.user.id);
        else setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No hay usuario autenticado") };
    
    // 1. Intentamos actualizar el perfil
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select();
    
    // 2. Si no hay error pero no devolvió datos, significa que la fila NO EXISTÍA
    // Esto ocurre si el Trigger de la BD falló o la cuenta es muy antigua.
    if (!error && data && data.length === 0) {
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert({ id: user.id, ...updates });
      
      if (insertError) return { error: new Error(insertError.message) };
    } else if (error) {
      return { error: new Error(error.message) };
    }
    
    await loadProfile(user.id);
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  // ── Notas del nutricionista ─────────────────────────────────────────────────
  const getNotes = async (): Promise<NutritionistNote[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("nutritionist_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error cargando notas:", error.message);
    return data ?? [];
  };

  const addNote = async (text: string, author: string) => {
    if (!user) return { error: new Error("Sin sesión") };
    const { error } = await supabase.from("nutritionist_notes").insert({
      user_id:     user.id,
      note_text:   text,
      author_name: author || "Sin especificar",
      note_date:   new Date().toISOString().split("T")[0],
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updateNote = async (id: string, text: string, author: string) => {
    if (!user) return { error: new Error("Sin sesión") };
    const { error } = await supabase
      .from("nutritionist_notes")
      .update({ note_text: text, author_name: author || "Sin especificar" })
      .eq("id", id)
      .eq("user_id", user.id);   // RLS extra: solo el dueño puede editar
    return { error: error ? new Error(error.message) : null };
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    await supabase
      .from("nutritionist_notes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  };

  // ── Exámenes médicos ────────────────────────────────────────────────────────
  const getLabResults = async (): Promise<LabResultRecord[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("lab_results")
      .select("*")
      .eq("user_id", user.id)
      .order("exam_date", { ascending: false });
    if (error) console.error("Error cargando exámenes:", error.message);
    return data ?? [];
  };

  // ── Historial de Peso ───────────────────────────────────────────────────────
  const getWeightLogs = async (): Promise<WeightLogRecord[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_date", { ascending: true }); // Ascendente para la gráfica
    if (error) console.error("Error cargando historial de peso:", error.message);
    return data ?? [];
  };

  const logWeight = async (weight: number) => {
    if (!user) return { error: new Error("Sin sesión") };
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    // Revisar si ya hay un peso registrado HOY para actualizarlo en vez de duplicar
    const { data: existing } = await supabase.from("weight_logs").select("id").eq("user_id", user.id).eq("logged_date", localDate).single();

    let dbError;
    if (existing) {
      const { error } = await supabase.from("weight_logs").update({ weight_kg: weight }).eq("id", existing.id);
      dbError = error;
    } else {
      const { error } = await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: weight, logged_date: localDate });
      dbError = error;
    }

    // También actualizamos el perfil principal
    if (!dbError) await updateProfile({ weight_kg: weight });
    return { error: dbError ? new Error(dbError.message) : null };
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading, profileLoading, profileLoadFailed,
      signUp, signIn, signOut, updateProfile, refreshProfile,
      getNotes, addNote, updateNote, deleteNote, getLabResults, getWeightLogs, logWeight,
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
