import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import StatusBar from "../components/StatusBar";
import type { Screen } from "../../types";
import type { Database } from "../../lib/database.types";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];
type DietGoal     = Database["public"]["Enums"]["diet_goal"];

// ─── Fórmulas para ajustar macros al cambiar de objetivo ─────────────────────
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentario: 1.2, ligero: 1.375, moderado: 1.55, activo: 1.725, muy_activo: 1.9,
};

function calcKcal(sex: string, weight: number, height: number, age: number, activity: ActivityLevel, goal: DietGoal): number {
  const bmr = sex === "femenino"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * (ACTIVITY_FACTOR[activity] ?? 1.375);
  if (goal === "bajar_peso")    return Math.round(tdee - 500);
  if (goal === "ganar_musculo") return Math.round(tdee + 250);
  return Math.round(tdee);
}

function calcMacros(kcal: number, weight: number, goal: DietGoal, dietType?: string | null) {
  if (dietType?.toLowerCase().includes("cetogénica")) {
    return {
      protein: Math.round((kcal * 0.20) / 4),
      carbs: Math.min(50, Math.round((kcal * 0.10) / 4)),
      fat: Math.round((kcal * 0.70) / 9),
    };
  }

  let protein = 0;
  let carbs = 0;
  let fat = 0;

  switch (goal) {
    case "bajar_peso":
      protein = Math.round(weight * 2);
      carbs = Math.round((kcal * 0.40) / 4);
      fat = Math.round((kcal - (protein * 4) - (carbs * 4)) / 9);
      break;
    case "ganar_musculo":
      protein = Math.round(weight * 2);
      carbs = Math.round((kcal * 0.50) / 4);
      fat = Math.round((kcal - (protein * 4) - (carbs * 4)) / 9);
      break;
    case "mejorar_salud":
      protein = Math.round(weight * 1.5);
      carbs = Math.round((kcal * 0.45) / 4);
      fat = Math.round((kcal - (protein * 4) - (carbs * 4)) / 9);
      break;
    case "mantener":
    default:
      protein = Math.round(weight * 1.5);
      carbs = Math.round((kcal * 0.50) / 4);
      fat = Math.round((kcal - (protein * 4) - (carbs * 4)) / 9);
      break;
  }

  if (fat < 0) fat = 0;
  return { protein, carbs, fat };
}

export default function MyObjetivesScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, updateProfile } = useAuth();
  const [goal, setGoal] = useState<DietGoal>(profile?.goal ?? "mantener");
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity_level ?? "sedentario");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Recalcular metas usando los datos actuales del perfil + el nuevo objetivo
    const sex = profile?.sex || "femenino";
    const weightKg = profile?.weight_kg || 65;
    const heightCm = profile?.height_cm || 165;
    const age = profile?.age || 25;

    const kcal = calcKcal(sex, weightKg, heightCm, age, activity, goal);
    const macros = calcMacros(kcal, weightKg, goal, profile?.diet_type);

    await updateProfile({
      goal,
      activity_level: activity,
      calories_goal: kcal,
      protein_goal_g: macros.protein,
      carbs_goal_g: macros.carbs,
      fat_goal_g: macros.fat,
    });
    
    setSaving(false);
    onNavigate("settings" as Screen);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 flex flex-col" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm sticky top-0 z-10">
        <StatusBar />
        <div className="flex items-center justify-between px-5 mt-1">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("settings" as Screen)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <ArrowLeft size={18} className="text-slate-600" />
            </button>
            <h2 className="text-xl font-extrabold text-slate-900">Mis Objetivos</h2>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-8 space-y-5 flex-1">
        <div className="space-y-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Meta principal</label>
            <select value={goal} onChange={e => setGoal(e.target.value as DietGoal)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors">
              <option value="bajar_peso">Bajar de peso</option>
              <option value="mantener">Mantener peso</option>
              <option value="ganar_musculo">Ganar músculo</option>
              <option value="mejorar_salud">Mejorar salud</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nivel de actividad</label>
            <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors">
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero (1-3 días/sem)</option>
              <option value="moderado">Moderado (4-5 días/sem)</option>
              <option value="activo">Activo (6-7 días/sem)</option>
              <option value="muy_activo">Muy activo (diario)</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-70">
          {saving ? "Guardando cambios..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}