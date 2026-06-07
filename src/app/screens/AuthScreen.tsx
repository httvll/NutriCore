// src/app/screens/AuthScreen.tsx
import { useState } from "react";
import { Leaf } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// Reutiliza el tipo Screen de App.tsx
type Screen = "home" | "onboarding" | "auth";

interface Props {
  onNavigate: (s: Screen) => void;
}

function StatusBar() {
  return (
    <div className="flex justify-between items-center px-5 pt-3 pb-1 text-[11px] font-semibold text-slate-700">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span>●●●</span><span>WiFi</span><span>▮▮▮</span>
      </div>
    </div>
  );
}

export default function AuthScreen({ onNavigate }: Props) {
  // useAuth() viene de AuthContext.tsx — ya envuelto en main.tsx
  const { signIn, signUp } = useAuth();

  const [mode, setMode]       = useState<"login" | "register">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    // 1. Limpiamos los espacios en blanco "fantasma" al principio y al final
    const cleanEmail = email.trim();

    // 2. Validamos los campos
    if (!cleanEmail || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      // 3. Pasamos el correo limpio a Supabase
      const { data, error } = await signIn(cleanEmail, password);
      if (error) {
        setError(error.message);
      } else {
        // Consultamos directamente a la base de datos ya que el estado 'profile'
        // del contexto aún no se ha actualizado en este punto.
        let hasProfile = false;
        if (data.user?.id) {
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("goal")
            .eq("id", data.user.id)
            .single();
          hasProfile = profileData?.goal != null;
        }
        onNavigate(hasProfile ? "home" : "onboarding");
      }
    } else {
      // 4. Pasamos el correo a Supabase. El nombre se llenará en el Onboarding
      const { error } = await signUp(cleanEmail, password, "");
      if (error) {
        setError(error.message);
      } else {
        onNavigate("onboarding");
      }
    }

    setLoading(false);
  }

  return (
    <div className="h-full bg-white flex flex-col overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <StatusBar />

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

      {/* Mode toggle */}
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

      {/* Fields */}
      <div className="px-6 space-y-3 flex-1">
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {mode === "login" && (
          <button className="text-emerald-600 text-sm font-semibold text-left">
            ¿Olvidaste tu contraseña?
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-red-600 text-xs font-semibold">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-60"
        >
          {loading
            ? "Cargando..."
            : mode === "login" ? "Iniciar sesión" : "Crear cuenta gratis"}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">o continúa con</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button className="w-full border border-slate-200 py-3.5 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <span className="text-base font-black text-blue-500">G</span> Continuar con Google
        </button>
      </div>

      <div className="h-6" />
    </div>
  );
}