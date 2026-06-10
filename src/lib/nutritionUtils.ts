import type { Database } from "./database.types";

type ActivityLevel = Database["public"]["Enums"]["activity_level"];
type DietGoal = Database["public"]["Enums"]["diet_goal"];

// --- Constantes ---

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export const GOAL_OPTIONS: { id: DietGoal; label: string, icon?: string }[] = [
    { id: "bajar_peso", label: "Bajar de peso", icon: "📉" },
    { id: "mantener", label: "Mantener peso", icon: "⚖️" },
    { id: "ganar_musculo", label: "Ganar músculo", icon: "💪" },
    { id: "mejorar_salud", label: "Mejorar salud", icon: "❤️" },
];

export const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
    { id: "sedentario", label: "Sedentario" },
    { id: "ligero", label: "Ligero (1-3 días/sem)" },
    { id: "moderado", label: "Moderado (4-5 días/sem)" },
    { id: "activo", label: "Activo (6-7 días/sem)" },
    { id: "muy_activo", label: "Muy activo (diario)" },
];

export const DIET_TYPES = ["Omnívoro", "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa", "Cetogénica", "Mediterránea", "Paleo"];

// --- Fórmulas de Cálculo ---

export function calcKcal(sex: string, weight: number, height: number, age: number, activity: ActivityLevel, goal: DietGoal): number {
  // Usamos 'otro' como default para el sexo, que calcula como masculino
  const bmr = sex === "femenino" ? 10 * weight + 6.25 * height - 5 * age - 161 : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = bmr * (ACTIVITY_FACTOR[activity] ?? 1.375);
  if (goal === "bajar_peso") return Math.round(tdee - 300);
  if (goal === "ganar_musculo") return Math.round(tdee + 300);
  return Math.round(tdee);
}

export function calcMacros(kcal: number, weight: number, goal: DietGoal, dietType?: string | null) {
    if (dietType?.toLowerCase().includes("cetogénica")) {
        return {
            protein: Math.round(weight * 2.0),
            carbs: Math.min(50, Math.round((kcal * 0.10) / 4)),
            fat: Math.round((kcal - (weight * 2.0 * 4) - (Math.min(50, Math.round((kcal * 0.10) / 4)) * 4)) / 9),
        };
    }
    let protein = 0, fat = 0, carbs = 0;
    switch (goal) {
        case "bajar_peso":
            protein = Math.round(weight * 2.2);
            fat = Math.round(weight * 0.8);
            break;
        case "ganar_musculo":
            protein = Math.round(weight * 2.0);
            fat = Math.round(weight * 1.0);
            break;
        default: // Mantenimiento y mejorar salud
            protein = Math.round(weight * 1.8);
            fat = Math.round(weight * 1.0);
            break;
    }
    const remainingKcal = kcal - (protein * 4) - (fat * 9);
    carbs = remainingKcal > 0 ? Math.round(remainingKcal / 4) : 0;
    return { protein, carbs, fat };
}