import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Screen } from "../../types";
import type { Database } from "../../lib/database.types";
import { calcKcal, calcMacros, GOAL_OPTIONS, ACTIVITY_OPTIONS, DIET_TYPES } from "../../lib/nutritionUtils";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];
type DietGoal = Database["public"]["Enums"]["diet_goal"];

export default function NutritionalProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
    const { profile, updateProfile } = useAuth();
    const [saving, setSaving] = useState(false);

    // --- Estados del formulario ---
    const [goal, setGoal] = useState<DietGoal>(profile?.goal ?? "mantener");
    // Cast a "any" en caso de que la definición TypeScript del perfil no tenga la propiedad aún
    const [goalWeight, setGoalWeight] = useState<number>((profile as any)?.goal_weight_kg ?? profile?.weight_kg ?? 65);
    const [activity, setActivity] = useState<ActivityLevel>(profile?.activity_level ?? "sedentario");
    const [dietType, setDietType] = useState<string[]>(profile?.diet_type ? profile.diet_type.split(", ") : []);
    const [allergyInput, setAllergyInput] = useState(profile?.allergies?.join(", ") ?? "");
    const [dislikedFoods, setDislikedFoods] = useState(profile?.disliked_foods ?? "");
    const [likedFoods, setLikedFoods] = useState((profile?.liked_foods as string) ?? "");

    const handleSave = async () => {
        setSaving(true);

        const sex = profile?.sex || "femenino";
        const weightKg = profile?.weight_kg || 65;
        const heightCm = profile?.height_cm || 165;
        const age = profile?.age || 25;

        const kcal = calcKcal(sex, weightKg, heightCm, age, activity, goal);
        const macros = calcMacros(kcal, weightKg, goal, dietType.join(", "));
        const parsedAllergies = allergyInput.split(",").map(s => s.trim()).filter(Boolean);

        await updateProfile({
            goal,
            activity_level: activity,
            calories_goal: kcal,
            protein_goal_g: macros.protein,
            carbs_goal_g: macros.carbs,
            fat_goal_g: macros.fat,
            diet_type: dietType.length > 0 ? dietType.join(", ") : null,
            allergies: parsedAllergies.length > 0 ? parsedAllergies : null,
            disliked_foods: dislikedFoods.trim() || null,
            liked_foods: likedFoods.trim() || null,
            // Guardamos el peso objetivo solo si aplica la meta
            goal_weight_kg: (goal === "bajar_peso" || goal === "ganar_musculo") ? goalWeight : null,
        } as any);

        setSaving(false);
        onNavigate("settings" as Screen);
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 flex flex-col" style={{ scrollbarWidth: "none" }}>
            <div className="bg-white pt-2 pb-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 px-5 mt-1">
                    <button onClick={() => onNavigate("settings" as Screen)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </button>
                    <h2 className="text-xl font-extrabold text-slate-900">Perfil Nutricional</h2>
                </div>
            </div>

            <div className="px-5 pt-5 pb-8 space-y-5 flex-1">
                <div className="space-y-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    {/* Objetivo */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Meta principal</label>
                        <select value={goal} onChange={e => setGoal(e.target.value as DietGoal)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors">
                            {GOAL_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                    </div>
                    {/* Peso Objetivo Condicional */}
                    {(goal === "bajar_peso" || goal === "ganar_musculo") && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Peso objetivo (kg)</label>
                            <div className="flex items-center px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 gap-3 focus-within:border-emerald-400 transition-colors">
                                <input type="number" value={goalWeight} min={30} max={300} onChange={e => setGoalWeight(Number(e.target.value))} className="flex-1 font-semibold text-slate-800 text-sm bg-transparent focus:outline-none" />
                                <span className="text-slate-400 font-semibold text-sm shrink-0">kg</span>
                            </div>
                        </div>
                    )}
                    {/* Actividad */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nivel de actividad</label>
                        <select value={activity} onChange={e => setActivity(e.target.value as ActivityLevel)} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800 focus:border-emerald-400 focus:outline-none transition-colors">
                            {ACTIVITY_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                        </select>
                    </div>
                    {/* Tipo de dieta */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Tipo de dieta</label>
                        <div className="flex flex-wrap gap-2">
                            {DIET_TYPES.map(d => (
                                <button key={d} onClick={() => setDietType(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${dietType.includes(d) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Alergias */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Alergias o restricciones</label>
                        <input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} placeholder="ej. nueces, mariscos..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                    {/* Alimentos que no gustan */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Alimentos que no te gustan</label>
                        <input value={dislikedFoods} onChange={e => setDislikedFoods(e.target.value)} placeholder="ej. cebolla, cilantro..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                     {/* Alimentos que si gustan */}
                     <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Alimentos que sí te gustan</label>
                        <input value={likedFoods} onChange={e => setLikedFoods(e.target.value)} placeholder="ej. palta, salmón..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400" />
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-70">
                    {saving ? "Guardando cambios..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
}