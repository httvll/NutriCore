import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, ResponsiveContainer, LineChart, Line } from "recharts";  
import { Screen } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { MealLog, WeightLogRecord } from "../../lib/database.types";

export default function StatsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, profile, getWeightLogs, logWeight } = useAuth();
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; kcal: number }[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightLogRecord[]>([]);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [plannedCount, setPlannedCount] = useState(0);
  
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile?.weight_kg || 65);
  const [savingWeight, setSavingWeight] = useState(false);

  const calGoal  = profile?.calories_goal || 0;
  const proGoal  = profile?.protein_goal_g || 0;
  const carbGoal = profile?.carbs_goal_g || 0;
  const fatGoal  = profile?.fat_goal_g || 0;
  const streak   = profile?.streak_days || 0;
  const weight   = profile?.weight_kg || 0;

  useEffect(() => {
    const loadTodayStats = async () => {
      if (!user) return;
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
      
      // Calcular la fecha de hace 7 días
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 6);
      const localLastWeek = new Date(lastWeek.getTime() - (lastWeek.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

      // Cargar historial de peso
      getWeightLogs().then(setWeightHistory);

      // Traer todos los registros de los últimos 7 días en 1 sola consulta
      const { data, error } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_date", localLastWeek)
        .lte("logged_date", localDate);

      if (!error && data) {
        const completedMeals = data.filter(m => m.completed);
        
        // 1. Comidas de hoy (solo para las barras de macros)
        setTodayMeals(completedMeals.filter(m => m.logged_date === localDate));

        // 2. Estadísticas semanales
        const planned = data.length;
        setCompletionRate(planned > 0 ? Math.round((completedMeals.length / planned) * 100) : 0);
        setPlannedCount(planned);
        setCompletedCount(completedMeals.length);
        
        const totalKcal = completedMeals.reduce((s, m) => s + m.kcal, 0);
        setWeeklyAvg(Math.round(totalKcal / 7));

        // 3. Gráfica (Rellenar los 7 días ordenados hasta hoy)
        const dayNames = ["D", "L", "M", "X", "J", "V", "S"];
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
          const dayKcal = completedMeals.filter(m => m.logged_date === dStr).reduce((s, m) => s + m.kcal, 0);
          chartData.push({ day: dayNames[d.getDay()], kcal: Math.round(dayKcal) });
        }
        setWeeklyData(chartData);
      }
    };
    loadTodayStats();
  }, [user, streak]);

  const handleSaveWeight = async () => {
    if (!newWeight || newWeight <= 0) return;
    setSavingWeight(true);
    const { error } = await logWeight(newWeight);
    if (!error) {
      // Refrescar historial
      getWeightLogs().then(setWeightHistory);
      setShowWeightModal(false);
    }
    setSavingWeight(false);
  };

  const proConsumed  = todayMeals.reduce((s, m) => s + m.protein_g, 0);
  const carbConsumed = todayMeals.reduce((s, m) => s + m.carbs_g, 0);
  const fatConsumed  = todayMeals.reduce((s, m) => s + m.fat_g, 0);

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1 px-5 mt-1">
          <button onClick={() => onNavigate("home")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Mi progreso</h2>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Weekly overview */}
        <div className="grid grid-cols-3 gap-3">
          {[[streak.toString(),"🔥","Días de racha"],[`${weeklyAvg}`,"kcal","Promedio semanal"],[`${completionRate}%`,"✓","Comidas completadas"]].map(([v,ic,l]) => (
            <div key={l} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <div className="text-lg mb-0.5">{ic}</div>
              <div className="text-xl font-extrabold text-slate-900">{v}</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-tight">{l}</div>
            </div>
          ))}
        </div>

        {/* Calorie chart */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900">Calorías semanales</h3>
            <span className="text-xs text-slate-500 font-semibold">Meta: {calGoal > 0 ? `${calGoal} kcal` : "--"}</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyData} barSize={28} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 2200]} />
              {calGoal > 0 && <ReferenceLine y={calGoal} stroke="#059669" strokeDasharray="4 3" strokeWidth={1.5} />}
              <Bar dataKey="kcal" radius={[8, 8, 4, 4]}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.kcal === 0 ? "#E2E8F0" : (calGoal > 0 && entry.kcal > calGoal) ? "#F97316" : "#059669"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            {[["#059669","Dentro de meta"],["#F97316","Sobre meta"],["#E2E8F0","Sin datos"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-[10px] text-slate-500 font-semibold">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Macro distribution */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Distribución de macros (hoy)</h3>
          <div className="space-y-3">
            {[
              { label: "Carbohidratos", consumed: Math.round(carbConsumed), goal: carbGoal, color: "#F59E0B", pct: carbGoal > 0 ? Math.min((carbConsumed / carbGoal) * 100, 100) : 0 },
              { label: "Proteínas", consumed: Math.round(proConsumed), goal: proGoal, color: "#3B82F6", pct: proGoal > 0 ? Math.min((proConsumed / proGoal) * 100, 100) : 0 },
              { label: "Grasas", consumed: Math.round(fatConsumed), goal: fatGoal, color: "#EC4899", pct: fatGoal > 0 ? Math.min((fatConsumed / fatGoal) * 100, 100) : 0 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{m.label}</span>
                  <span className="font-semibold text-slate-500">{m.consumed}g / {m.goal > 0 ? `${m.goal}g` : "--"}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weight progress */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-extrabold text-slate-900">Progreso de peso</h3>
            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-full">
              Actual: {weight > 0 ? `${weight} kg` : "--"}
            </span>
          </div>
          {weightHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={weightHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="logged_date" tickFormatter={(v) => v.split("-").slice(1).reverse().join("/")} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Line type="monotone" dataKey="weight_kg" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: "#059669", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-20 text-center px-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
              <p className="text-[11px] text-slate-400 font-medium">Registra más días para ver tu evolución gráfica.</p>
            </div>
          )}
          <button onClick={() => setShowWeightModal(true)} className="w-full mt-3 py-3 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Plus size={14} /> Registrar peso de hoy
          </button>
        </div>

        {/* Achievement badges */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Tus logros</h3>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {[
              { icon: "🌱", label: "Primer paso", unlocked: completedCount >= 1 },
              { icon: "🔥", label: "Racha 3d", unlocked: streak >= 3 },
              { icon: "🥗", label: "5 comidas", unlocked: completedCount >= 5 },
              { icon: "⚡", label: "Plan perfecto", unlocked: plannedCount > 0 && completedCount === plannedCount },
            ].map(({ icon, label, unlocked }) => (
              <div key={label} className={`min-w-[80px] flex-1 rounded-2xl p-3 text-center border transition-all ${unlocked ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100 opacity-60 grayscale"}`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className={`text-[9px] font-bold leading-tight ${unlocked ? "text-amber-700" : "text-slate-400"}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-4" />
      </div>

      {/* Modal para Registrar Peso */}
      {showWeightModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowWeightModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-extrabold text-slate-900 mb-2">Registrar Peso</h3>
            <p className="text-xs text-slate-500 mb-5">Ingresa tu peso actual. Esto actualizará tu perfil y tu gráfica histórica.</p>
            
            <div className="flex items-center gap-3 mb-6 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3">
              <input 
                type="number" 
                value={newWeight} 
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="flex-1 bg-transparent text-lg font-bold text-slate-800 focus:outline-none"
                autoFocus
              />
              <span className="text-slate-500 font-bold">kg</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">Cancelar</button>
              <button onClick={handleSaveWeight} disabled={savingWeight} className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50">
                {savingWeight ? "Guardando..." : "Guardar hoy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}