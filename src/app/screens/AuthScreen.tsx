// src/app/screens/AuthScreen.tsx
// ─── Pantalla de autenticación real ──────────────────────────────────────────
// Reemplaza el AuthScreen actual de App.tsx.
// Usa useAuth() para conectar con Supabase — no más hardcoding.

import { useState } from "react";
import { Leaf } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Screen = "splash" | "auth" | "onboarding" | "home" | string;

interface AuthScreenProps {
  onNavigate: (s: Screen) => void;
}

export function AuthScreen({ onNavigate }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // Validaciones básicas
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 carácteres.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(mapAuthError(error.message));
      } else {
        onNavigate("home");
      }
    } else {
      const { error } = await signUp(email.trim(), password, fullName.trim());
      if (error) {
        setError(mapAuthError(error.message));
      } else {
        // Usuario nuevo → va al onboarding para completar su perfil
        onNavigate("onboarding");
      }
    }

    setLoading(false);
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Status bar */}
      <div className="flex justify-between items-center px-5 pt-3 pb-1 text-[11px] font-semibold text-slate-700">
        <span>9:41</span>
        <div className="flex items-center gap-1"><span>●●●</span><span>WiFi</span><span>▮▮▮</span></div>
      </div>

      {/* Header */}
      <div className="px-6 pt-6 pb-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {mode === "login" ? "Bienvenida de vuelta" : "Crear cuenta"}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {mode === "login" ? "Accede a tu plan nutricional" : "Empieza tu viaje saludable"}
        </p>
      </div>

      {/* Tab selector */}
      <div className="mx-6 flex bg-slate-100 rounded-2xl p-1 mb-5">
        {(["login", "register"] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === m ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"
            }`}
          >
            {m === "login" ? "Iniciar sesión" : "Registrarse"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="px-6 space-y-3 flex-1">
        {mode === "register" && (
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Valentina García"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {mode === "login" && (
          <button className="text-emerald-600 text-sm font-semibold">
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-60 disabled:scale-100"
        >
          {loading
            ? "Cargando..."
            : mode === "login" ? "Iniciar sesión" : "Crear cuenta gratis"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">o continúa con</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google (placeholder — requiere configurar OAuth en Supabase Dashboard) */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-slate-200 py-3.5 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <span className="text-base font-black text-blue-500">G</span> Continuar con Google
        </button>
      </div>
      <div className="h-6" />
    </div>
  );

  async function handleGoogleSignIn() {
    // Para habilitar Google OAuth:
    // 1. En Supabase Dashboard → Authentication → Providers → Google
    // 2. Configura Client ID y Secret de Google Cloud Console
    // 3. Descomenta la línea de abajo:
    // await supabase.auth.signInWithOAuth({ provider: "google" });
    alert("Configura Google OAuth en el Supabase Dashboard para activar esto.");
  }
}

// ─── Mapeo de errores de Supabase a español ───────────────────────────────────
function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (message.includes("Email not confirmed"))
    return "Debes confirmar tu correo electrónico antes de ingresar.";
  if (message.includes("User already registered"))
    return "Ya existe una cuenta con ese correo. Intenta iniciar sesión.";
  if (message.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (message.includes("rate limit"))
    return "Demasiados intentos. Espera unos minutos.";
  return message; // fallback: mostrar el mensaje original
}
