import { useState, useEffect } from "react";
import { Search, Star, Clock } from "lucide-react";
import { Screen, Recipe } from "../../types";
import { supabase } from "../../lib/supabase";
import StatusBar from "../components/StatusBar";

export default function RecipesScreen({ onNavigate, onSelectRecipe }: { onNavigate: (s: Screen) => void, onSelectRecipe: (r: Recipe) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const cats = ["Todos", "Desayuno", "Almuerzo", "Cena", "Snack"];

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("recipes").select("*");
      
      if (!error && data) {
        const mappedRecipes: Recipe[] = data.map(r => ({
          ...r,
          time: `${r.time_min} min`, // Mapeamos el campo numérico al texto esperado por la UI
          macros: r.macros as { protein: number; carbs: number; fat: number },
          tags: r.tags || [],
          ingredients: r.ingredients || [],
          instructions: r.instructions || ""
        }));
        setRecipes(mappedRecipes);
      } else if (error) {
        console.error("Error al cargar recetas:", error.message);
      }
      setLoading(false);
    };

    fetchRecipes();
  }, []);

  const shown = recipes.filter(r =>
    (filter === "Todos" || r.category === filter) &&
    (search === "" || r.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-4 shadow-sm">
        <StatusBar />
        <div className="px-5 mt-1">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">Recetas</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-3 mb-3">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar recetas..."
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2" style={{ scrollbarWidth: "none" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === c ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {loading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Cargando recetas...</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 font-semibold mb-3">{shown.length} recetas encontradas</p>
            <div className="grid grid-cols-2 gap-3">
              {shown.map(r => (
                <button key={r.id} onClick={() => { onSelectRecipe(r); onNavigate("recipeDetail"); }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 text-left active:scale-95 transition-transform">
                  <div className="h-24 flex items-center justify-center text-5xl" style={{ background: `${r.color}20` }}>
                    {r.emoji}
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: r.color }}>{r.category}</span>
                    <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">{r.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold text-slate-700">{r.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-500">{r.time}</span>
                      </div>
                    </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-sm font-extrabold text-emerald-600">{r.calories}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mb-[2px]">kcal</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
