import { useState, useMemo } from "react";
import { RefreshCw, ShoppingBag, Check, Plus, ChefHat, Trash2 } from "lucide-react";
import { Screen } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { RecipeRecord } from "../../lib/database.types";
import { useWeeklyPlan } from "./useWeeklyPlan";

const SLOT_INFO: Record<string, { emoji: string; time: string; type: string }> = {
  desayuno: { emoji: "☀️", time: "08:00", type: "Desayuno" },
  almuerzo: { emoji: "🌞", time: "13:30", type: "Almuerzo" },
  snack:    { emoji: "🍎", time: "16:30", type: "Snack" },
  cena:     { emoji: "🌙", time: "20:00", type: "Cena" },
};

// Función para generar los 7 días de la semana actual dinámicamente
function getWeekDays() {
  const today = new Date();
  // Usamos getTimezoneOffset para no desfasar los días por el cambio de UTC local
  const localTodayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const days = [];
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const fullDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    
    days.push({
      key: fullDate,
      label: dayNames[d.getDay()],
      date: d.getDate().toString(),
      fullDate,
      today: fullDate === localTodayStr
    });
  }
  return { days, localTodayStr };
}

export default function PlannerScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile } = useAuth();
  const { days: initialDays, localTodayStr } = useMemo(() => getWeekDays(), []);
  
  const [weekDays] = useState(initialDays);
  const [selectedDate, setSelectedDate] = useState(localTodayStr);
  const [viewingRecipe, setViewingRecipe] = useState<RecipeRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Usamos toda la lógica desde nuestro Custom Hook
  const { dayMeals, isGenerating, loadMeals, toggleMeal, removeMeal, generatePlan } = useWeeklyPlan(selectedDate, weekDays);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const calGoal = profile?.calories_goal || 1850;
  const totalKcal = dayMeals.reduce((s, m) => s + m.kcal, 0);

  const handleViewMeal = async (recipeId: number) => {
    const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();
    if (data && !error) {
      setViewingRecipe(data);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMeals();
    setIsRefreshing(false);
    showToast("Plan sincronizado correctamente");
  };

  const handleGeneratePlan = async () => {
    try {
      await generatePlan();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showToast("Error generando el plan: " + msg);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <div className="px-5 mt-1">
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Plan semanal</h2>
          <button onClick={handleRefresh} disabled={isRefreshing} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70">
            <RefreshCw size={16} className={`text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2" style={{ scrollbarWidth: "none" }}>
          {weekDays.map(d => (
            <button key={d.key} onClick={() => setSelectedDate(d.fullDate)}
              className={`flex flex-col items-center min-w-[44px] py-2.5 px-2 rounded-2xl transition-all ${selectedDate === d.fullDate ? "bg-emerald-600 text-white" : d.today ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
              <span className="text-[10px] font-semibold">{d.label}</span>
              <span className="text-sm font-extrabold mt-0.5">{d.date}</span>
              {d.today && selectedDate !== d.fullDate && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Day summary */}
        {dayMeals.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total del día</p>
              <p className="text-xl font-extrabold text-slate-900">{totalKcal} <span className="text-sm font-semibold text-slate-500">kcal</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold">Meta</p>
              <p className="text-lg font-extrabold text-emerald-600">{calGoal} kcal</p>
            </div>
          </div>
        )}

        {dayMeals.length === 0 ? (
          <div className="flex flex-col gap-3 my-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <p className="text-sm font-bold text-slate-700 mb-1">Día sin planificar</p>
              <p className="text-xs text-slate-500 mb-4">Agrega recetas a tu plan para este día.</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => onNavigate("recipes" as unknown as Screen)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-full active:scale-95 transition-transform">
                  Explorar catálogo →
                </button>
                <button onClick={() => onNavigate("recipes" as unknown as Screen)} className="text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2.5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5">
                  <Plus size={14} /> Agregar comida
                </button>
              </div>
            </div>
            
            {/* Botón de Plan Sugerido Automático */}
            <button 
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full bg-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70">
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <ChefHat size={18} />}
              <span className="text-sm font-bold">{isGenerating ? "Generando menú..." : "Generar plan semanal sugerido"}</span>
            </button>

            {/* Link a lista de compras en estado vacío */}
            <button onClick={() => onNavigate("shopping")}
              className="w-full mt-1 text-emerald-600 font-bold py-3 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <ShoppingBag size={16} /> Ver lista de compras
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {dayMeals.map(m => {
                const info = SLOT_INFO[m.meal_slot] || { emoji: "🍽️", time: "12:00", type: "Comida" };
                return (
                  <div key={m.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-3">
                      <button onClick={() => onNavigate("recipes" as unknown as Screen)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <RefreshCw size={16} />
                      </button>
                      <button onClick={() => removeMeal(m.id)} className="text-red-500 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <button onClick={() => handleViewMeal(m.recipe_id)} className="w-full text-left flex items-center gap-3 mb-3 active:scale-[0.98] transition-transform pr-16">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${m.completed ? "bg-emerald-50" : "bg-slate-50"}`}>
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{info.type}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{info.time}h</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{m.recipe_name}</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{m.kcal} kcal · C{m.carbs_g}g · P{m.protein_g}g · G{m.fat_g}g</p>
                      </div>
                    </button>
                    
                    <button onClick={() => toggleMeal(m)} className={`w-full py-2.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${m.completed ? "border-slate-200 text-slate-500 bg-white" : "border-emerald-200 text-emerald-700 bg-emerald-50"}`}>
                      <Check size={14} /> {m.completed ? "Desmarcar" : "Confirmar"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Botones de acción cuando hay comidas */}
            <button onClick={() => onNavigate("recipes" as unknown as Screen)}
              className="w-full mt-5 text-emerald-600 font-bold py-2 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Plus size={16} /> Agregar comida
            </button>

            <button onClick={() => onNavigate("shopping")}
              className="w-full mt-2 bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
              <ShoppingBag size={16} /> Ver lista de compras
            </button>
          </>
        )}
        <div className="h-4" />
      </div>

      {/* Recipe Detail Modal */}
      {viewingRecipe && (
        <div className="absolute inset-0 bg-black/40 z-[60] flex flex-col justify-end" onClick={() => setViewingRecipe(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: "none" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${viewingRecipe.color}18` }}>
                {viewingRecipe.emoji}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1 inline-block" style={{ background: `${viewingRecipe.color}20`, color: viewingRecipe.color }}>
                  {viewingRecipe.category}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{viewingRecipe.name}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 bg-slate-50 rounded-2xl py-2 px-3 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">Tiempo</span>
                <span className="text-sm font-extrabold text-slate-900">{viewingRecipe.time_min} min</span>
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl py-2 px-3 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">Dificultad</span>
                <span className="text-sm font-extrabold text-slate-900">{viewingRecipe.difficulty}</span>
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl py-2 px-3 text-center">
                <span className="text-[10px] text-slate-500 font-bold block">Rating</span>
                <span className="text-sm font-extrabold text-slate-900">⭐ {viewingRecipe.rating}</span>
              </div>
            </div>

            <h4 className="text-sm font-extrabold text-slate-900 mb-2">Ingredientes</h4>
            <div className="space-y-1.5 mb-5">
              {viewingRecipe.ingredients?.map((ing: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: viewingRecipe.color }} />
                  <span className="text-xs text-slate-700 font-medium">{ing}</span>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-extrabold text-slate-900 mb-2">Preparación</h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {viewingRecipe.instructions}
            </p>

            <button onClick={() => setViewingRecipe(null)} className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm active:scale-95 transition-transform">
              Cerrar detalles
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
