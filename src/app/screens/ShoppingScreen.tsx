import { useState, useEffect } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Screen } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import StatusBar from "../components/StatusBar";

type ShoppingItem = { name: string; qty: string; checked: boolean; rawName: string };
type ShoppingCategory = { category: string; color: string; icon: string; items: ShoppingItem[] };

// Categorías y palabras clave para clasificar automáticamente los ingredientes
const CATEGORIES = [
  { id: "Proteínas", color: "#3B82F6", icon: "🥩", keywords: ["pollo", "salmón", "atún", "pavo", "huevo", "carne", "pescado"] },
  { id: "Granos y cereales", color: "#F59E0B", icon: "🌾", keywords: ["avena", "quinoa", "arroz", "tortilla", "tostada", "pan", "pasta", "fideos"] },
  { id: "Frutas y verduras", color: "#10B981", icon: "🥦", keywords: ["espinaca", "brócoli", "plátano", "aguacate", "tomate", "manzana", "limón", "zanahoria", "pepino", "piña", "frambuesa", "ajo", "cebolla", "lechuga"] },
  { id: "Lácteos y altern.", color: "#8B5CF6", icon: "🥛", keywords: ["leche", "yogur", "queso", "mantequilla"] },
];

function categorizeIngredient(ing: string): string {
  const lower = ing.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => lower.includes(k))) return cat.id;
  }
  return "Otros";
}

function parseIngredient(raw: string) {
  // Separa inteligentemente la cantidad (ej. "150g", "1/2 taza", "2 cdas") del nombre del ingrediente
  const match = raw.match(/^([\d½¼¾/.,]+\s*(?:g|kg|ml|l|taza|tazas|cda|cdas|cdita|lata|latas|uds\.?|pieza|piezas|dientes)?)\s+(.*)$/i);
  if (match) return { qty: match[1].trim(), name: match[2].trim() };
  return { qty: "-", name: raw };
}

export default function ShoppingScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user } = useAuth();
  const [list, setList] = useState<ShoppingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShoppingList = async () => {
      if (!user) return;
      setLoading(true);

      // Obtener la fecha local actual
      const today = new Date();
      const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

      // 1. Obtener todas las comidas planificadas desde hoy en adelante
      const { data: logs, error: logsError } = await supabase
        .from("meal_logs")
        .select("recipe_id")
        .eq("user_id", user.id)
        .gte("logged_date", localToday);

      if (logsError || !logs || logs.length === 0) {
        setList([]);
        setLoading(false);
        return;
      }

      // 2. Extraer los IDs únicos de recetas
      const recipeIds = [...new Set(logs.map(l => l.recipe_id))];

      // 3. Buscar la información y los ingredientes de esas recetas
      const { data: recipes, error: recipesError } = await supabase
        .from("recipes")
        .select("ingredients")
        .in("id", recipeIds);

      if (recipesError || !recipes) {
        setLoading(false);
        return;
      }

      // 4. Extraer todos los ingredientes y combinarlos (eliminando exactos duplicados)
      const allIngs: string[] = [];
      recipes.forEach(r => {
        if (Array.isArray(r.ingredients)) allIngs.push(...r.ingredients);
      });
      const uniqueIngs = [...new Set(allIngs)];

      // 5. Categorizar y formatear
      const catMap: Record<string, ShoppingItem[]> = {
        "Proteínas": [], "Granos y cereales": [], "Frutas y verduras": [], "Lácteos y altern.": [], "Otros": []
      };

      uniqueIngs.forEach(raw => {
        const cat = categorizeIngredient(raw);
        const { qty, name } = parseIngredient(raw);
        catMap[cat].push({ name, qty, rawName: raw, checked: false });
      });

      // 6. Construir el estado final limpio
      const finalCategories: ShoppingCategory[] = [];
      CATEGORIES.forEach(c => {
        if (catMap[c.id].length > 0) finalCategories.push({ category: c.id, color: c.color, icon: c.icon, items: catMap[c.id] });
      });
      if (catMap["Otros"].length > 0) {
        finalCategories.push({ category: "Otros", color: "#64748B", icon: "🛒", items: catMap["Otros"] });
      }

      setList(finalCategories);
      setLoading(false);
    };

    loadShoppingList();
  }, [user]);

  const totalItems = list.reduce((s, c) => s + c.items.length, 0);
  const checkedItems = list.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);

  const toggle = (ci: number, ii: number) => setList(prev =>
    prev.map((c, cIdx) => cIdx !== ci ? c : { ...c, items: c.items.map((it, iIdx) => iIdx !== ii ? it : { ...it, checked: !it.checked }) })
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white pt-2 pb-5 shadow-sm">
        <StatusBar />
        <div className="px-5 mt-1">
          <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Lista de compras</h2>
          <button onClick={() => onNavigate("planner")} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            Del plan ↗
          </button>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-800">{checkedItems} de {totalItems} artículos</span>
            <span className="text-xs font-bold text-emerald-600">{progress}%</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Generando lista...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 mt-6 mx-5">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={24} className="text-slate-400" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-2">Lista vacía</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">No tienes comidas planificadas para los próximos días. Agrega recetas a tu plan para generar los ingredientes automáticamente.</p>
          <button onClick={() => onNavigate("planner")} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
            Ir al planificador
          </button>
        </div>
      ) : (
        <div className="px-5 pt-4 space-y-4">
          {list.map((cat, ci) => (
            <div key={cat.category} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <span className="text-xl">{cat.icon}</span>
                <h3 className="text-sm font-extrabold text-slate-900">{cat.category}</h3>
                <div className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                  {cat.items.filter(i => i.checked).length}/{cat.items.length}
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {cat.items.map((item, ii) => (
                  <button key={ii} onClick={() => toggle(ci, ii)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                      {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`flex-1 text-sm text-left font-semibold ${item.checked ? "line-through text-slate-400" : "text-slate-800"}`}>{item.name}</span>
                    <span className="text-xs text-slate-400 font-semibold">{item.qty}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="h-4" />
        </div>
      )}
    </div>
  );
}