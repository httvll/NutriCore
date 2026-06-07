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
        let minDiff = Infinity;

        // Probar 150 combinaciones aleatorias para acercarse al calGoal
        for (let i = 0; i < 150; i++) {
          const b = breakfasts[Math.floor(Math.random() * breakfasts.length)];
          const l = lunches[Math.floor(Math.random() * lunches.length)];
          const d = dinners[Math.floor(Math.random() * dinners.length)];
          
          let currentKcal = b.calories + l.calories + d.calories;
          let selectedSnacks: typeof snacks = [];
          
          // Agregar snacks inteligentemente si nos faltan calorías para la meta
          if (snacks.length > 0) {
            let deficit = calGoal - currentKcal;
            
            // Si faltan más de 100 kcal, agregamos un snack para complementar
            if (deficit > 100) {
              const s1 = snacks[Math.floor(Math.random() * snacks.length)];
              selectedSnacks.push(s1);
              currentKcal += s1.calories;
              deficit -= s1.calories;
            }
            
            // Si AÚN nos faltan más de 100 kcal, agregamos un segundo snack
            if (deficit > 100) {
              const s2 = snacks[Math.floor(Math.random() * snacks.length)];
              selectedSnacks.push(s2);
              currentKcal += s2.calories;
            }
          }
          
          const diff = Math.abs(currentKcal - calGoal);

          if (diff < minDiff) {
            minDiff = diff;
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