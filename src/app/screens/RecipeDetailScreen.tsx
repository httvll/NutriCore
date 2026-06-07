import { useState } from "react";
import StatusBar from "../components/StatusBar";
import { ArrowLeft, Star } from "lucide-react";
import { Recipe } from "../../types";
import { Screen } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function RecipeDetailScreen({ recipe, onNavigate }: { recipe: Recipe; onNavigate: (s: Screen) => void }) {
  const [saved, setSaved] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { user } = useAuth();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddToPlan = async () => {
    if (!user) return showToast("Debes iniciar sesión para añadir al plan.");
    setIsAdding(true);

    // 1. Usar la fecha local de hoy (evitando desajustes por UTC)
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    // 2. Mapear la categoría al 'meal_slot' (desayuno, almuerzo, cena, snack)
    let slot: "desayuno" | "almuerzo" | "cena" | "snack" = "almuerzo";
    const cat = recipe.category.toLowerCase();
    if (cat.includes("desayuno")) slot = "desayuno";
    else if (cat.includes("cena")) slot = "cena";
    else if (cat.includes("snack")) slot = "snack";

    // 3. Insertar en la base de datos
    const { error } = await supabase.from("meal_logs").insert({
      user_id: user.id,
      logged_date: localDate,
      meal_slot: slot,
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      kcal: recipe.calories,
      protein_g: recipe.macros.protein,
      carbs_g: recipe.macros.carbs,
      fat_g: recipe.macros.fat,
      completed: false
    });

    setIsAdding(false);
    if (error) console.error("Error al guardar en el plan:", error.message);
    else onNavigate("planner" as unknown as Screen); // Ir al planificador
  };

  return (
    <div className="h-full overflow-y-auto bg-white" style={{ scrollbarWidth: "none" }}>
      <div className="relative h-56 flex flex-col" style={{ background: `linear-gradient(160deg, ${recipe.color}40, ${recipe.color}15)` }}>
        <div className="absolute inset-x-0 top-0"><StatusBar /></div>
        <div className="absolute inset-x-0 top-12 flex justify-between px-5">
          <button onClick={() => onNavigate("recipes")} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <button onClick={() => setSaved(!saved)} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
            <Star size={18} className={saved ? "text-amber-400 fill-amber-400" : "text-slate-500"} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center mt-6">
          <div className="text-8xl">{recipe.emoji}</div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ background: `${recipe.color}20`, color: recipe.color }}>
              {recipe.category}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2 leading-tight">{recipe.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 my-4">
          {[[recipe.rating.toString(),"⭐","Rating"],[recipe.time,"⏱","Tiempo"],[recipe.difficulty,"📊","Nivel"]].map(([v,ic,l]) => (
            <div key={l} className="flex-1 text-center bg-slate-50 rounded-2xl py-3">
              <div className="text-base">{ic}</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">{v}</div>
              <div className="text-[10px] text-slate-500 font-semibold">{l}</div>
            </div>
          ))}
        </div>

        {/* Macros */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Macronutrientes por porción</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="text-lg font-extrabold text-slate-900">{recipe.calories}</div><div className="text-[10px] text-slate-500 font-semibold">kcal</div></div>
            <div><div className="text-lg font-extrabold text-amber-500">{recipe.macros.carbs}g</div><div className="text-[10px] text-slate-500 font-semibold">Carbos</div></div>
            <div><div className="text-lg font-extrabold text-blue-600">{recipe.macros.protein}g</div><div className="text-[10px] text-slate-500 font-semibold">Proteína</div></div>
            <div><div className="text-lg font-extrabold text-pink-500">{recipe.macros.fat}g</div><div className="text-[10px] text-slate-500 font-semibold">Grasas</div></div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-5">
          {recipe.tags.map(t => (
            <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${recipe.color}18`, color: recipe.color }}>{t}</span>
          ))}
        </div>

        {/* Ingredients */}
        <h3 className="text-base font-extrabold text-slate-900 mb-3">Ingredientes</h3>
        <div className="space-y-2 mb-5">
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: recipe.color }}>
                {i + 1}
              </div>
              <span className="text-sm text-slate-700 font-medium">{ing}</span>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <h3 className="text-base font-extrabold text-slate-900 mb-3">Preparación</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{recipe.instructions}</p>

        <button 
          onClick={handleAddToPlan}
          disabled={isAdding}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-95 transition-transform disabled:opacity-70 disabled:scale-100"
          style={{ background: `linear-gradient(135deg, ${recipe.color}, ${recipe.color}cc)` }}>
          {isAdding ? "Añadiendo..." : "Añadir a mi plan de hoy"}
        </button>

    {/* Toast Notification */}
    {toastMsg && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-bold z-[100] shadow-xl animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap">
        {toastMsg}
      </div>
    )}
        <div className="h-6" />
      </div>
    </div>
  );
}
