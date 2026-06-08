// COSAS POR HACER EN ESTE ARCHIVO:
// Permitir seleccionar más opciones. Agregar paso acerca de las comidas preferidas 

// src/app/screens/OnboardingScreen.tsx
import { useState } from "react";
import { Leaf, ArrowLeft, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Database } from "../../lib/database.types";

type Screen = "home" | "onboarding";

interface Props {
  onNavigate: (s: Screen) => void;
}

// Tipos de los enums de Supabase (ya definidos en database.types.ts)
type ActivityLevel = Database["public"]["Enums"]["activity_level"];
type DietGoal     = Database["public"]["Enums"]["diet_goal"];

// Opciones de edad 10–100
const AGE_OPTIONS = Array.from({ length: 91 }, (_, i) => i + 10);


// ─── Calculo calórico (Mifflin-St Jeor) ──────────────────────────────────────
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentario:  1.2,
  ligero:      1.375,
  moderado:    1.55,
  activo:      1.725,
  muy_activo:  1.9,
};

function calcKcal(
  sex: "masculino" | "femenino" | "otro",
  weight: number,
  height: number,
  age: number,
  activity: ActivityLevel,
  goal: DietGoal,
): number {
  const bmr =
    sex === "femenino"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * (ACTIVITY_FACTOR[activity] ?? 1.375);
  if (goal === "bajar_peso")    return Math.round(tdee - 300);
  if (goal === "ganar_musculo") return Math.round(tdee + 300);
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

// ─── Mapeo UI → enum Supabase ─────────────────────────────────────────────────
const GOAL_OPTIONS: { id: DietGoal; icon: string; label: string }[] = [
  { id: "bajar_peso",      icon: "📉", label: "Bajar de peso"  },
  { id: "mantener",        icon: "⚖️", label: "Mantener peso"  },
  { id: "ganar_musculo",   icon: "💪", label: "Ganar músculo"  },
  { id: "mejorar_salud",   icon: "❤️", label: "Mejorar salud" },
];

const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
  { id: "sedentario", label: "Sedentario"              },
  { id: "ligero",     label: "Ligero (1-3 días/sem)"   },
  { id: "moderado",   label: "Moderado (4-5 días/sem)" },
  { id: "activo",     label: "Activo (6-7 días/sem)"   },
  { id: "muy_activo", label: "Muy activo (diario)"     },
];

const DIET_TYPES = [
  "Omnívoro", "Vegetariano", "Vegano",
  "Sin gluten", "Sin lactosa", "Cetogénica", "Mediterránea", "Paleo",
];

// ─── Componente ───────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onNavigate }: Props) {
  const { updateProfile, profile } = useAuth();

  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Estado del formulario (inicializa desde perfil existente si ya hay algo) ─
  const [fullName, setFullName]     = useState(profile?.full_name ?? "");
  const [age, setAge]               = useState<number>(profile?.age ?? 25);
  const [sex, setSex]               = useState<"masculino" | "femenino" | "otro">(profile?.sex ?? "femenino");
  const [heightCm, setHeightCm]     = useState<number>(profile?.height_cm ?? 165);
  const [weightKg, setWeightKg]     = useState<number>(profile?.weight_kg ?? 65);
  const [goalWeight, setGoalWeight] = useState<number>(65);
  const [goal, setGoal]             = useState<DietGoal | "">(profile?.goal ?? "");
  const [activity, setActivity]     = useState<ActivityLevel | "">(profile?.activity_level ?? "");
  const [dietType, setDietType]     = useState<string[]>(profile?.diet_type ? profile.diet_type.split(", ") : []);
  const [allergies, setAllergies]   = useState<string[]>(profile?.allergies ?? []);
  const [allergyInput, setAllergyInput] = useState(profile?.allergies?.join(", ") ?? "");
  const [dislikedFoods, setDislikedFoods] = useState(profile?.disliked_foods ?? "");

  const totalSteps = 5;

  // ── Validación por paso ───────────────────────────────────────────────────────
  function validate(): string | null {
    if (step === 0 && !fullName.trim()) return "Ingresa tu nombre completo.";
    if (step === 1) {
      if (!heightCm || heightCm < 100 || heightCm > 250) return "Altura inválida (100–250 cm).";
      if (!weightKg  || weightKg  < 30  || weightKg  > 300) return "Peso inválido (30–300 kg).";
    }
    if (step === 2 && !goal)     return "Selecciona tu objetivo.";
    if (step === 3 && !activity) return "Selecciona tu nivel de actividad.";
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  }

  // ── Guardado final en Supabase via updateProfile de AuthContext ───────────────
  async function handleFinish() {
    setSaving(true);
    setError(null);

    // Parsear alergias del input de texto
    const parsedAllergies = allergyInput
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const kcal = goal && activity && sex
      ? calcKcal(sex, weightKg, heightCm, age, activity as ActivityLevel, goal as DietGoal)
      : null;

    const macros = kcal ? calcMacros(kcal, weightKg, goal as DietGoal, dietType.join(", ")) : null;

    const { error } = await updateProfile({
      full_name:      fullName.trim(),
      age,
      sex,
      height_cm:      heightCm,
      weight_kg:      weightKg,
      goal:           goal as DietGoal,
      activity_level: activity as ActivityLevel,
      diet_type:      dietType.length > 0 ? dietType.join(", ") : null,
      allergies:      parsedAllergies.length > 0 ? parsedAllergies : null,
      disliked_foods: dislikedFoods.trim() || null,
      calories_goal:  kcal,
      protein_goal_g: macros?.protein ?? null,
      carbs_goal_g:   macros?.carbs   ?? null,
      fat_goal_g:     macros?.fat     ?? null,
    });

    setSaving(false);
    if (error) { setError(error.message); return; }
    onNavigate("home");
  }

  // ── Contenido de cada paso ────────────────────────────────────────────────────
  const steps = [
    // PASO 0 — Nombre, Edad, Sexo
    {
      title: "¿Cuál es tu nombre?",
      subtitle: "Personalizaremos tu experiencia",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
              Nombre completo
            </label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Valentina García"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Edad</label>
              <div className="relative">
                <select
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full appearance-none px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-emerald-400"
                >
                  {AGE_OPTIONS.map(a => <option key={a} value={a}>{a} años</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Sexo</label>
              <div className="flex gap-2">
                {(["femenino", "masculino"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      sex === s ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s === "femenino" ? "♀ Mujer" : "♂ Hombre"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // PASO 1 — Medidas corporales
    {
      title: "Tus medidas",
      subtitle: "Para calcular tus necesidades calóricas",
      content: (
        <div className="space-y-4">
          {[
            { label: "Altura (cm)",       value: heightCm,   set: setHeightCm,   min: 100, max: 250, unit: "cm" },
            { label: "Peso actual (kg)",   value: weightKg,   set: setWeightKg,   min: 30,  max: 300, unit: "kg" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{f.label}</label>
              <div className="flex items-center px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 gap-3">
                <input
                  type="number"
                  value={f.value}
                  min={f.min}
                  max={f.max}
                  onChange={e => f.set(Number(e.target.value))}
                  className="flex-1 font-bold text-slate-800 text-lg bg-transparent focus:outline-none"
                />
                <span className="text-slate-400 font-semibold shrink-0">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    // PASO 2 — Objetivo
    {
      title: "¿Cuál es tu objetivo?",
      subtitle: "Crearemos un plan adaptado a ti",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {GOAL_OPTIONS.map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  goal === g.id
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="text-3xl mb-2">{g.icon}</div>
                <div className={`text-xs font-bold ${goal === g.id ? "text-emerald-700" : "text-slate-700"}`}>
                  {g.label}
                </div>
              </button>
            ))}
          </div>
          {(goal === "bajar_peso" || goal === "ganar_musculo") && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Peso objetivo (kg)</label>
              <div className="flex items-center px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 gap-3 focus-within:border-emerald-400 transition-colors">
                <input type="number" value={goalWeight} min={30} max={300} onChange={e => setGoalWeight(Number(e.target.value))} className="flex-1 font-bold text-slate-800 text-lg bg-transparent focus:outline-none" />
                <span className="text-slate-400 font-semibold shrink-0">kg</span>
              </div>
            </div>
          )}
        </div>
      ),
    },

    // PASO 3 — Dieta, alergias, actividad
    {
      title: "Preferencias alimenticias", 
      subtitle: "Selecciona todo lo que aplique",
      content: (
        <div className="space-y-4">
          {/* Tipo de dieta */}
          <div className="flex flex-wrap gap-2">
            {DIET_TYPES.map(d => (
              <button
                key={d}
                onClick={() => setDietType(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                  dietType.includes(d)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Alergias */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              Alergias o restricciones
            </label>
            <input
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              placeholder="ej. nueces, mariscos, gluten..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">Separa con comas</p>
          </div>

          {/* Alimentos no deseados */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              Alimentos que no te gustan
            </label>
            <input
              value={dislikedFoods}
              onChange={e => setDislikedFoods(e.target.value)}
              placeholder="ej. cebolla, champiñones, cilantro..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">El planificador excluirá estos ingredientes</p>
          </div>

          {/* Nivel de actividad */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              Nivel de actividad física
            </label>
            <div className="space-y-2">
              {ACTIVITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActivity(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    activity === opt.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    activity === opt.id ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  }`}>
                    {activity === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-xs font-semibold ${activity === opt.id ? "text-emerald-700" : "text-slate-700"}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // PASO 4 — Resumen calculado
    {
      title: "¡Todo listo! 🎉",
      subtitle: "Tu plan nutricional está siendo creado",
      content: (() => {
        const kcal = (goal && activity && sex && weightKg && heightCm && age)
          ? calcKcal(sex, weightKg, heightCm, age, activity as ActivityLevel, goal as DietGoal)
          : 1800;
        const { protein, carbs, fat } = calcMacros(kcal, weightKg || 65, (goal || "mantener") as DietGoal, dietType.join(", "));
        return (
          <div className="text-center py-4">
            <div className="w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-14 h-14 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              Hola, {fullName.split(" ")[0] || "ahí"} 👋
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tu plan personalizado es de{" "}
              <span className="font-bold text-emerald-600">{kcal.toLocaleString("es-CL")} kcal/día</span>
              , calculado según tu perfil y objetivos.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                [protein + "g", "Proteínas",     "#3B82F6"],
                [carbs   + "g", "Carbohidratos", "#F59E0B"],
                [fat     + "g", "Grasas",        "#EC4899"],
              ] as [string, string, string][]).map(([v, l, c]) => (
                <div key={l} className="rounded-2xl p-3" style={{ background: `${c}15` }}>
                  <div className="text-base font-extrabold" style={{ color: c }}>{v}</div>
                  <div className="text-[10px] text-slate-600 font-medium">{l}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })(),
    },
  ];

  const current    = steps[step];
  const isLastStep = step === totalSteps - 1;

  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 pt-2 pb-4 flex flex-col flex-1 min-h-0">

        {/* Barra de progreso */}
        <div className="flex items-center justify-between mb-5">
          {step > 0
            ? (
              <button
                onClick={() => { setStep(s => s - 1); setError(null); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100"
              >
                <ArrowLeft size={18} className="text-slate-600" />
              </button>
            )
            : <div />}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-emerald-600" : i < step ? "w-3 bg-emerald-300" : "w-3 bg-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400">{step + 1}/{totalSteps}</span>
        </div>

        <div className="mb-1 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full w-fit">
          <Leaf size={12} /> NutriCore
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{current.title}</h2>
        <p className="text-slate-500 text-sm mt-0.5 mb-5">{current.subtitle}</p>

        {/* Contenido del paso */}
        <div className="overflow-y-auto flex-1 min-h-0 pb-4" style={{ scrollbarWidth: "none" }}>
          {current.content}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-red-600 text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Botón CTA */}
        <div className="mt-4 shrink-0">
          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Comenzar mi plan →"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}