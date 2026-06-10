import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import type { MealLog } from "../../lib/database.types";

export function useWeeklyPlan(selectedDate: string, weekDays: { fullDate: string }[]) {
  const { user, profile } = useAuth();
  const [dayMeals, setDayMeals] = useState<MealLog[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("logged_date", selectedDate)
      .order("logged_at", { ascending: true });
    
    if (!error && data) setDayMeals(data);
  }, [user, selectedDate]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const toggleMeal = async (meal: MealLog) => {
    setDayMeals(ms => ms.map(m => m.id === meal.id ? { ...m, completed: !m.completed } : m));
    await supabase.from("meal_logs").update({ completed: !meal.completed }).eq("id", meal.id);
  };

  const removeMeal = async (id: string) => {
    setDayMeals(ms => ms.filter(m => m.id !== id));
    await supabase.from("meal_logs").delete().eq("id", id);
  };

  const generatePlan = async () => {
    if (!user || !profile) throw new Error("Sesión no encontrada");
    setIsGenerating(true);
    
    try {
      const calGoal = profile.calories_goal || 1850;
      const { data: recipes, error } = await supabase.from("recipes").select("*");
      if (error || !recipes) throw new Error("No se pudieron cargar las recetas base.");

      const userDiets = profile.diet_type ? profile.diet_type.split(",").map(d => d.trim().toLowerCase()) : [];
      const userAllergies = profile.allergies ? profile.allergies.map(a => a.toLowerCase()) : [];
      const userDislikes = profile.disliked_foods ? profile.disliked_foods.split(",").map(d => d.trim().toLowerCase()).filter(Boolean) : [];

      const exclusions = [...userAllergies, ...userDislikes];

      let filteredRecipes = recipes.filter(r => {
        const hasExclusion = exclusions.some(exclusion => 
          r.ingredients?.some((ing: string) => ing.toLowerCase().includes(exclusion)) || 
          r.name.toLowerCase().includes(exclusion)
        );
        return !hasExclusion;
      });

      if (userDiets.length > 0 && !userDiets.includes("omnívoro")) {
        const dietFiltered = filteredRecipes.filter(r => {
          const tags = r.tags ? r.tags.map((t: string) => t.toLowerCase()) : [];
          return userDiets.every(diet => tags.includes(diet) || r.name.toLowerCase().includes(diet));
        });

        const bCount = dietFiltered.filter(r => r.category.toLowerCase().includes("desayuno")).length;
        const lCount = dietFiltered.filter(r => r.category.toLowerCase().includes("almuerzo")).length;
        const dCount = dietFiltered.filter(r => r.category.toLowerCase().includes("cena")).length;

        if (bCount > 0 && lCount > 0 && dCount > 0) {
          filteredRecipes = dietFiltered;
        }
      }

      const breakfasts = filteredRecipes.filter(r => r.category.toLowerCase().includes("desayuno"));
      const lunches = filteredRecipes.filter(r => r.category.toLowerCase().includes("almuerzo"));
      const dinners = filteredRecipes.filter(r => r.category.toLowerCase().includes("cena"));
      const snacks = filteredRecipes.filter(r => r.category.toLowerCase().includes("snack"));

      if (!breakfasts.length || !lunches.length || !dinners.length) {
        throw new Error("No hay suficientes recetas en cada categoría para generar un plan.");
      }

      for (const day of weekDays) {
        const { data: existing } = await supabase.from("meal_logs").select("id").eq("user_id", user.id).eq("logged_date", day.fullDate);
        if (existing && existing.length > 0) continue; 

        let bestCombo = null;
        let minPenalty = Infinity; // Cambiamos minDiff por minPenalty

        // Definir metas de macros ideales basadas en el perfil (o porcentajes genéricos saludables)
        // 1g Proteína = 4 kcal | 1g Carbo = 4 kcal | 1g Grasa = 9 kcal
        // En useWeeklyPlan.ts, dentro de la función generatePlan
        const targetProteinG = profile.protein_goal_g || (calGoal * 0.25) / 4; 
        const targetFatG = profile.fat_goal_g || (calGoal * 0.25) / 9;     
        const targetCarbsG = profile.carbs_goal_g || (calGoal * 0.50) / 4;

        // Aumentamos las iteraciones a 300 para buscar mejores combinaciones de macros
        for (let i = 0; i < 300; i++) {
          const b = breakfasts[Math.floor(Math.random() * breakfasts.length)];
          const l = lunches[Math.floor(Math.random() * lunches.length)];
          const d = dinners[Math.floor(Math.random() * dinners.length)];
          
          let currentCombo = [b, l, d];
          let currentKcal = currentCombo.reduce((sum, meal) => sum + meal.calories, 0);
          let currentPro = currentCombo.reduce((sum, meal) => sum + ((meal.macros as any)?.protein || 0), 0);
          let currentFat = currentCombo.reduce((sum, meal) => sum + ((meal.macros as any)?.fat || 0), 0);
          let currentCarb = currentCombo.reduce((sum, meal) => sum + ((meal.macros as any)?.carbs || 0), 0);
          
          let selectedSnacks: typeof snacks = [];
          
          if (snacks.length > 0) {
            let deficit = calGoal - currentKcal;
            
            // Intento de agregar hasta 2 snacks si hay déficit calórico
            for (let j = 0; j < 2; j++) {
              if (deficit > 100) {
                 const s = snacks[Math.floor(Math.random() * snacks.length)];
                 selectedSnacks.push(s);
                 currentKcal += s.calories;
                 currentPro += (s.macros as any)?.protein || 0;
                 currentFat += (s.macros as any)?.fat || 0;
                 currentCarb += (s.macros as any)?.carbs || 0;
                 deficit -= s.calories;
              }
            }
          }
          
          // --- FUNCIÓN DE PÉRDIDA (PENALIZACIÓN ASIMÉTRICA) ---
          const diffKcal = Math.abs(currentKcal - calGoal);
          const diffPro = Math.abs(currentPro - targetProteinG);
          const diffCarb = Math.abs(currentCarb - targetCarbsG);

          // Separamos el cálculo de las grasas
          const fatExcess = Math.max(0, currentFat - targetFatG); // Cuánto se pasó
          const fatDeficit = Math.max(0, targetFatG - currentFat); // Cuánto le faltó

          // Castigamos brutalmente el EXCESO de grasa (x25), 
          // pero somos amables con el déficit (x9)
          const fatPenalty = (fatExcess * 25) + (fatDeficit * 9);

          // Calculamos la penalización total
          const penalty = (diffKcal * 1) + (diffPro * 4) + fatPenalty + (diffCarb * 2);

          if (penalty < minPenalty) {
            minPenalty = penalty;
            bestCombo = { b, l, d, snacks: selectedSnacks };
          }
        }

        if (!bestCombo) continue;

        const mealsToInsert = [
          { slot: "desayuno", recipe: bestCombo.b },
          { slot: "almuerzo", recipe: bestCombo.l },
          { slot: "cena", recipe: bestCombo.d }
        ];
        
        bestCombo.snacks.forEach((snack) => {
          mealsToInsert.push({ slot: "snack", recipe: snack });
        });

        const inserts = mealsToInsert.map(m => ({
          user_id: user.id, logged_date: day.fullDate, meal_slot: m.slot as "desayuno" | "almuerzo" | "cena" | "snack", recipe_id: m.recipe.id, recipe_name: m.recipe.name, kcal: m.recipe.calories, protein_g: (m.recipe.macros as { protein?: number })?.protein || 0, carbs_g: (m.recipe.macros as { carbs?: number })?.carbs || 0, fat_g: (m.recipe.macros as { fat?: number })?.fat || 0, completed: false
        }));

        await supabase.from("meal_logs").insert(inserts);
      }

      await loadMeals(); 
    } finally {
      setIsGenerating(false);
    }
  };

  return { dayMeals, isGenerating, loadMeals, toggleMeal, removeMeal, generatePlan };
}