import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CalorieRing } from "../components/CalorieRing";
import { MacroBar } from "../components/MacroBar";
import { Screen } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { MealLog } from "../../lib/database.types";
import StatusBar from "../components/StatusBar";

const SLOT_INFO: Record<string, { emoji: string; time: string; type: string }> = {
  desayuno: { emoji: "☀️", time: "08:00", type: "Desayuno" },
  almuerzo: { emoji: "🌞", time: "13:30", type: "Almuerzo" },
  snack:    { emoji: "🍎", time: "16:30", type: "Snack" },
  cena:     { emoji: "🌙", time: "20:00", type: "Cena" },
};

export default function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, profile } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [waterConsumed, setWaterConsumed] = useState(0); // Estado interactivo local temporal
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Lista vacía por defecto
  const waterGoal = 8;

  // ── Extraer y calcular info del perfil ──
  const firstName = profile?.full_name?.split(" ")[0] || "Usuario";
  const streak = profile?.streak_days || 0;
  
  const calGoal  = profile?.calories_goal || 0;
  const proGoal  = profile?.protein_goal_g || 0;
  const carbGoal = profile?.carbs_goal_g || 0;
  const fatGoal  = profile?.fat_goal_g || 0;

  // ── Calcular lo consumido en base a los logs de la BD ──
  const calConsumed  = meals.filter(m => m.completed).reduce((s, m) => s + m.kcal, 0);
  const proConsumed  = meals.filter(m => m.completed).reduce((s, m) => s + m.protein_g, 0);
  const carbConsumed = meals.filter(m => m.completed).reduce((s, m) => s + m.carbs_g, 0);
  const fatConsumed  = meals.filter(m => m.completed).reduce((s, m) => s + m.fat_g, 0);

  const macros = [
    { label: "Proteínas", consumed: proConsumed, goal: proGoal, unit: "g", color: "#3B82F6" },
    { label: "Carbohidratos", consumed: carbConsumed, goal: carbGoal, unit: "g", color: "#F59E0B" },
    { label: "Grasas", consumed: fatConsumed, goal: fatGoal, unit: "g", color: "#EC4899" },
  ];

  // ── Cargar comidas de hoy desde Supabase ──
  useEffect(() => {
    if (!user) return;
    const loadMeals = async () => {
      // Usamos el huso horario local para evitar desajustes de fecha
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("logged_date", localDate)
        .order("logged_at", { ascending: true });
      
      if (!error && data) setMeals(data);
    };
    loadMeals();
  }, [user]);

  const toggleMeal = async (meal: MealLog) => {
    setMeals(ms => ms.map(m => m.id === meal.id ? { ...m, completed: !m.completed } : m));
    await supabase.from("meal_logs").update({ completed: !meal.completed }).eq("id", meal.id);
  };

  const toggleWater = (i: number) => {
    setWaterConsumed(prev => (prev === i + 1 ? i : i + 1));
  };

  const dateStr = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="bg-white pt-2 pb-5 shadow-sm">
        <StatusBar />
        <div className="px-5 mt-1">
          <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-slate-500 font-semibold">{formattedDate}</p>
            <h2 className="text-xl font-extrabold text-slate-900">Buenos días, {firstName} 👋</h2>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
              <span className="text-xl text-slate-600" aria-hidden="true">🔔</span>
            </button>
            {notifications.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">{notifications.length}</span>
              </div>
            )}
          </div>
        </div>
        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 w-max">
            <span className="text-amber-500 text-lg" aria-hidden="true">🔥</span>
            <span className="text-xs font-bold text-amber-700">Racha de {streak} días · ¡Sigue así!</span>
          </div>
        )}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Calorie card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Calorías hoy</h3>
              <p className="text-xs text-slate-500">Meta diaria: {calGoal > 0 ? `${calGoal} kcal` : "No definida"}</p>
            </div>
            <button onClick={() => onNavigate("stats" as unknown as Screen)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Ver progreso</button>
          </div>
          {calGoal > 0 ? (
            <div className="flex items-center gap-5">
              <CalorieRing consumed={calConsumed} goal={calGoal} />
              <div className="flex-1 space-y-3">
                {macros.map(m => (
                  <MacroBar key={m.label} label={m.label} consumed={m.consumed} goal={m.goal} color={m.color} unit={m.unit} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
              <p className="text-sm font-bold text-slate-700 mb-1">Sin metas definidas</p>
              <p className="text-xs text-slate-500 mb-3">Configura tu perfil para ver tu progreso diario.</p>
              <button onClick={() => onNavigate("editProfile" as unknown as Screen)} className="text-xs font-bold text-emerald-600 bg-emerald-100 px-4 py-2.5 rounded-full active:scale-95 transition-transform">
                Configurar perfil
              </button>
            </div>
          )}
        </div>

        {/* Water tracker */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-500 text-lg" aria-hidden="true">💧</span>
              <span className="text-sm font-bold text-slate-900">Hidratación</span>
            </div>
            <span className="text-xs font-bold text-blue-600">{waterConsumed}/{waterGoal} vasos</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: waterGoal }).map((_, i) => (
              <button key={i} onClick={() => toggleWater(i)} className={`flex-1 h-7 rounded-lg transition-all ${i < waterConsumed ? "bg-blue-400" : "bg-slate-100"}`} />
            ))}
          </div>
        </div>

        {/* Today's meals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Comidas de hoy</h3>
            <button onClick={() => onNavigate("planner" as unknown as Screen)} className="text-xs font-bold text-emerald-600">Ver plan →</button>
          </div>
          <div className="space-y-2.5">
            {meals.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-700 mb-1">Tu plan de hoy está vacío</p>
                <p className="text-xs text-slate-500 mb-4">Añade comidas desde el planificador para empezar tu día.</p>
                <button onClick={() => onNavigate("planner" as unknown as Screen)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-full">
                  Ir al Planificador →
                </button>
              </div>
            ) : (
              meals.map(m => {
                const info = SLOT_INFO[m.meal_slot] || { emoji: "🍽️", time: "12:00", type: "Comida" };
                return (
                  <div key={m.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${m.completed ? "border-emerald-100" : "border-slate-100"}`}>
                <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${m.completed ? "bg-emerald-50" : "bg-slate-50"}`}>
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{info.type}</span>
                          <span className="text-[10px] text-slate-400">· {info.time}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate">{m.recipe_name}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-semibold">{m.kcal} kcal</span>
                          <span className="text-[11px] text-amber-500 font-semibold">C:{m.carbs_g}g</span>
                          <span className="text-[11px] text-blue-500 font-semibold">P:{m.protein_g}g</span>
                          <span className="text-[11px] text-pink-500 font-semibold">G:{m.fat_g}g</span>
                        </div>
                      </div>
                      <button onClick={() => toggleMeal(m)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${m.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                        <span className="text-base" aria-hidden="true">✓</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Panel de Notificaciones (Side Drawer con deslizamiento fluido) */}
      <div 
        className={`absolute inset-0 z-50 transition-all duration-300 ${showNotifications ? "opacity-100 visible" : "opacity-0 invisible"}`} 
      >
        {/* Fondo oscuro semi-transparente */}
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowNotifications(false)} />
        
        {/* Contenedor lateral derecho (ocupa el 75% de la pantalla) */}
        <div 
          className={`absolute top-0 right-0 h-full w-[75%] bg-white px-5 pb-5 pt-12 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${showNotifications ? "translate-x-0" : "translate-x-full"}`} 
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-lg font-extrabold text-slate-900">Notificaciones</h3>
            <button onClick={() => setShowNotifications(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-95 transition-transform shrink-0">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center pb-10">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-base font-extrabold text-slate-900">Al día</p>
                <p className="text-sm text-slate-500 mt-1 max-w-[150px] mx-auto">No tienes notificaciones nuevas por el momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-600 text-xs">🔔</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{n.title}</p>
                    </div>
                    <p className="text-xs text-slate-500">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
