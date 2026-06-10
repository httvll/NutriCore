import { useState } from "react";
import { ArrowLeft, Bell, Target, User, Zap, Activity, X, ChevronRight, Home, Leaf, Info, Shield } from "lucide-react";
import { Screen } from "../../types";   
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, user, signOut } = useAuth();
  const [notifs, setNotifs] = useState(true);
  const [dark, setDark] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Extraer y formatear datos del perfil ──
  const fullName = profile?.full_name || "Usuario";
  const goalLabels: Record<string, string> = {
    bajar_peso: "Perder peso", 
    mantener: "Mantener peso",
    ganar_musculo: "Ganar músculo", 
    mejorar_salud: "Mejorar salud",
  };
  const goalText = profile?.goal ? goalLabels[profile.goal] || profile.goal : "Sin objetivo";
  const kcalText = profile?.calories_goal ? `${profile.calories_goal} kcal` : "-- kcal";

  // ── Eliminar datos de la cuenta ──
  const handleDeleteAccount = async () => {
    const confirm = window.confirm("¿Estás seguro de que deseas eliminar tus datos y reiniciar tu cuenta? Esta acción es irreversible.");
    if (!confirm || !user) return;
    
    // Borramos el perfil de la base de datos pública
    // Por seguridad, los logs (meal_logs, etc) se eliminan solos por el "ON DELETE CASCADE" que configuramos
    await supabase.from("user_profiles").delete().eq("id", user.id);
    await signOut();
    onNavigate("splash" as Screen);
  };

  const sections: { title: string; items: Array<{ icon: typeof Home; label: string; sub: string; color: string; toggle?: boolean; togVal?: boolean; onTog?: () => void; onClick?: () => void }> }[] = [
    { title: "Cuenta", items: [
      { icon: User, label: "Datos personales", sub: "Nombre, peso, altura...", color: "#059669", onClick: () => onNavigate("editProfile" as Screen) },
      { icon: Target, label: "Perfil Nutricional", sub: "Metas, dieta y preferencias", color: "#3B82F6", onClick: () => onNavigate("nutritionalProfile" as Screen) },
      { icon: Shield, label: "Seguridad", sub: "Contraseña y correo", color: "#64748B", onClick: () => onNavigate("security" as Screen) },
    ]},
    { title: "Preferencias", items: [
      { icon: Bell, label: "Notificaciones", sub: "Recordatorios de comidas", color: "#F59E0B", toggle: true, togVal: notifs, onTog: () => { setNotifs(v => !v); showToast(notifs ? "Notificaciones desactivadas" : "Notificaciones activadas"); } },
      { icon: Zap, label: "Modo oscuro", sub: "Apariencia", color: "#8B5CF6", toggle: true, togVal: dark, onTog: () => { setDark(v => !v); showToast("El modo oscuro próximamente..."); } },
    ]},
    { title: "Acerca de la app", items: [
      { icon: Info, label: "Información de NutriCore", sub: "Metodología, calidad y equipo", color: "#6366F1", onClick: () => onNavigate("about" as Screen) },
    ]},
    { title: "Datos y privacidad", items: [
      { icon: Activity, label: "Exportar datos", sub: "CSV / PDF", color: "#10B981", onClick: () => showToast("Generación de CSV en desarrollo...") },
      { icon: X, label: "Eliminar cuenta", sub: "Acción irreversible", color: "#EF4444", onClick: handleDeleteAccount },
    ]},
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <div className="flex items-center gap-3 px-5 mt-1">
          <button onClick={() => onNavigate("profile")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Ajustes</h2>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {sections.map(sec => (
          <div key={sec.title}>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">{sec.title}</p>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {sec.items.map(({ icon: Icon, label, sub, color, toggle, togVal, onTog, onClick }, i) => {
            const Wrapper = onClick ? "button" : "div";
            return (
              <Wrapper key={label} onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 text-left ${i < sec.items.length - 1 ? "border-b border-slate-50" : ""} ${onClick ? "active:bg-slate-50 transition-colors" : ""}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
                </div>
                {toggle ? (
                  <button onClick={(e) => { e.stopPropagation(); onTog?.(); }}
                    className={`w-12 h-6 rounded-full transition-all relative ${togVal ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${togVal ? "left-6" : "left-0.5"}`} />
                  </button>
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
              </Wrapper>
            );
          })}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Leaf size={20} className="text-emerald-600" />
          </div>
          <p className="text-sm font-extrabold text-slate-900">NutriCore</p>
          <p className="text-xs text-slate-400 font-medium">Versión 1.0.0 MVP</p>
        </div>
        <div className="h-4" />
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
          {toastMsg}
        </div>
      )}
    </div>
  );
}