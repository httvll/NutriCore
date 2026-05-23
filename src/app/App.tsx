import { useState, useEffect } from "react";
import {
  Leaf, Home, Calendar, BookOpen, ShoppingBag, User, Bell,
  ChevronRight, Check, Plus, Star, RefreshCw, Droplets, Flame,
  Search, ArrowLeft, Settings, Edit3, Award, Clock,
  X, Activity, TrendingUp, Target, CheckCircle2, Circle,
  ChevronDown, Zap, BarChart2, Coffee,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { AuthProvider, useAuth } from "../context/AuthContext";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "auth" | "onboarding"
  | "home" | "planner" | "recipes" | "recipeDetail"
  | "shopping" | "profile" | "stats" | "settings";

interface Recipe {
  id: number; name: string; category: string; emoji: string; color: string;
  calories: number; time: string; rating: number; difficulty: string;
  macros: { protein: number; carbs: number; fat: number };
  tags: string[]; ingredients: string[]; instructions: string;
}

interface Meal {
  id: number; type: string; emoji: string; time: string;
  name: string; kcal: number; completed: boolean;
  macros: { protein: number; carbs: number; fat: number };
  items: string[];
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const USER = {
  name: "Valentina", age: 28, weight: 62, height: 165,
  streak: 14, goal: "Perder peso", bmi: 22.8,
  calories: { goal: 1850, consumed: 1240 },
  water: { goal: 8, consumed: 5 },
  macros: {
    protein: { goal: 130, consumed: 78, label: "Proteínas", unit: "g", color: "#3B82F6" },
    carbs:   { goal: 185, consumed: 142, label: "Carbohidratos", unit: "g", color: "#F59E0B" },
    fat:     { goal: 52,  consumed: 31,  label: "Grasas", unit: "g", color: "#EC4899" },
  },
};

const TODAY_MEALS: Meal[] = [
  { id: 1, type: "Desayuno",  emoji: "☀️",  time: "7:30",  name: "Avena con plátano y miel",      kcal: 380, completed: true,  macros: { protein: 12, carbs: 68, fat: 7  }, items: ["½ taza avena", "1 plátano", "1 cda miel", "½ taza leche almendras"] },
  { id: 2, type: "Snack AM",  emoji: "🍎",  time: "10:00", name: "Manzana con almendras",          kcal: 180, completed: true,  macros: { protein: 4,  carbs: 28, fat: 9  }, items: ["1 manzana", "15 almendras"] },
  { id: 3, type: "Almuerzo",  emoji: "🌞",  time: "13:00", name: "Bowl de pollo y quinoa",         kcal: 520, completed: false, macros: { protein: 45, carbs: 52, fat: 12 }, items: ["150g pollo", "½ taza quinoa", "Verduras asadas", "Aceite de oliva"] },
  { id: 4, type: "Cena",      emoji: "🌙",  time: "19:30", name: "Salmón al horno con brócoli",    kcal: 420, completed: false, macros: { protein: 39, carbs: 22, fat: 18 }, items: ["150g salmón", "1 taza brócoli", "Limón y especias"] },
];

const WEEK_DAYS = [
  { key: "L", label: "Lun", date: "19" },
  { key: "M", label: "Mar", date: "20" },
  { key: "X", label: "Mié", date: "21" },
  { key: "J", label: "Jue", date: "22", today: true },
  { key: "V", label: "Vie", date: "23" },
  { key: "S", label: "Sáb", date: "24" },
  { key: "D", label: "Dom", date: "25" },
];

const WEEK_PLAN: Record<string, Meal[]> = {
  L: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Tostadas con aguacate",     kcal: 350, completed: true,  macros: { protein: 10, carbs: 42, fat: 18 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Ensalada mediterránea",      kcal: 480, completed: true,  macros: { protein: 38, carbs: 28, fat: 22 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Pasta integral con verduras",kcal: 520, completed: true,  macros: { protein: 22, carbs: 78, fat: 14 }, items: [] },
  ],
  M: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Yogur griego con frutos rojos", kcal: 290, completed: true,  macros: { protein: 18, carbs: 36, fat: 6  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Wrap de pavo y hummus",          kcal: 410, completed: true,  macros: { protein: 32, carbs: 48, fat: 10 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Merluza al vapor con arroz",     kcal: 450, completed: false, macros: { protein: 36, carbs: 52, fat: 8  }, items: [] },
  ],
  X: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Batido verde energizante",  kcal: 220, completed: true,  macros: { protein: 8,  carbs: 42, fat: 4  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Pollo al curry con arroz",   kcal: 550, completed: true,  macros: { protein: 42, carbs: 58, fat: 16 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Sopa de lentejas",           kcal: 380, completed: false, macros: { protein: 20, carbs: 58, fat: 8  }, items: [] },
  ],
  J: TODAY_MEALS,
  V: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "7:30",  name: "Pancakes de avena proteicos",kcal: 340, completed: false, macros: { protein: 22, carbs: 46, fat: 10 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "13:00", name: "Poke bowl de atún",           kcal: 490, completed: false, macros: { protein: 38, carbs: 54, fat: 14 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "19:30", name: "Revuelto de huevos y verduras",kcal: 320,completed: false, macros: { protein: 24, carbs: 18, fat: 18 }, items: [] },
  ],
  S: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "9:00",  name: "Tortilla francesa con tostadas",kcal: 380, completed: false, macros: { protein: 20, carbs: 36, fat: 16 }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "14:00", name: "Hamburguesa de legumbres",       kcal: 520, completed: false, macros: { protein: 28, carbs: 62, fat: 18 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "20:00", name: "Tabla de quesos y vegetales",    kcal: 420, completed: false, macros: { protein: 22, carbs: 28, fat: 24 }, items: [] },
  ],
  D: [
    { id: 1, type: "Desayuno", emoji: "☀️", time: "9:30",  name: "Overnight oats de frambuesa",  kcal: 360, completed: false, macros: { protein: 16, carbs: 58, fat: 8  }, items: [] },
    { id: 2, type: "Almuerzo", emoji: "🌞", time: "14:00", name: "Risotto de calabaza",            kcal: 510, completed: false, macros: { protein: 18, carbs: 72, fat: 14 }, items: [] },
    { id: 3, type: "Cena",     emoji: "🌙", time: "20:00", name: "Gazpacho y tostadas integrales", kcal: 280, completed: false, macros: { protein: 10, carbs: 46, fat: 8  }, items: [] },
  ],
};

const RECIPES: Recipe[] = [
  { id: 1, name: "Bowl Proteico de Pollo",    category: "Almuerzo",  emoji: "🥗", color: "#059669", calories: 520, time: "25 min", rating: 4.8, difficulty: "Fácil",     macros: { protein: 45, carbs: 52, fat: 12 }, tags: ["Alta proteína", "Sin gluten"],   ingredients: ["150g pechuga de pollo", "½ taza quinoa cocida", "½ aguacate", "1 taza espinacas", "Tomates cherry", "1 cda aceite oliva", "Limón y sal al gusto"], instructions: "Cocina la quinoa. Marina y cocina el pollo a la plancha 7 min por lado. Arma el bowl con espinacas, quinoa, pollo en tiras, aguacate y tomates. Aliña con limón y aceite de oliva." },
  { id: 2, name: "Avena Overnight",           category: "Desayuno",  emoji: "🫙", color: "#F59E0B", calories: 380, time: "5 min",  rating: 4.9, difficulty: "Muy fácil", macros: { protein: 14, carbs: 62, fat: 8  }, tags: ["Vegetariano", "Rápido"],        ingredients: ["½ taza avena integral", "¾ taza leche almendras", "1 cda chía", "1 cda miel", "½ plátano", "Frutos rojos al gusto"], instructions: "Mezcla avena, leche y chía en un frasco. Refrigera mínimo 6 horas. Al servir, agrega miel, plátano y frutos rojos." },
  { id: 3, name: "Salmón al Horno",           category: "Cena",      emoji: "🐟", color: "#3B82F6", calories: 420, time: "35 min", rating: 4.7, difficulty: "Media",     macros: { protein: 39, carbs: 22, fat: 18 }, tags: ["Omega-3", "Sin lactosa"],       ingredients: ["150g filete de salmón", "1 taza brócoli", "1 zanahoria", "1 cda aceite oliva", "2 dientes ajo", "Zumo de limón", "Tomillo, sal y pimienta"], instructions: "Precalienta horno 200°C. Aliña el salmón con aceite, ajo, limón y tomillo. Coloca con verduras y hornea 20-25 minutos." },
  { id: 4, name: "Wrap de Pavo y Hummus",     category: "Almuerzo",  emoji: "🌯", color: "#8B5CF6", calories: 410, time: "10 min", rating: 4.6, difficulty: "Muy fácil", macros: { protein: 32, carbs: 48, fat: 10 }, tags: ["Alto en fibra", "Rápido"],      ingredients: ["1 tortilla integral", "120g pavo en lonchas", "2 cdas hummus", "Lechuga romana", "1 tomate", "½ pepino en bastones"], instructions: "Extiende hummus sobre la tortilla. Agrega pavo, lechuga, tomate y pepino. Enrolla y corta en diagonal." },
  { id: 5, name: "Batido Verde Energizante",  category: "Snack",     emoji: "🥤", color: "#10B981", calories: 220, time: "5 min",  rating: 4.5, difficulty: "Muy fácil", macros: { protein: 8,  carbs: 42, fat: 4  }, tags: ["Vegano", "Detox"],             ingredients: ["1 taza espinacas baby", "½ plátano congelado", "½ taza piña", "1 cda jengibre rallado", "1 taza agua de coco", "Miel al gusto"], instructions: "Licúa todos los ingredientes a velocidad alta 60 segundos. Sirve inmediatamente." },
  { id: 6, name: "Huevos Benedictinos Fit",   category: "Desayuno",  emoji: "🍳", color: "#EC4899", calories: 440, time: "20 min", rating: 4.8, difficulty: "Media",     macros: { protein: 28, carbs: 32, fat: 20 }, tags: ["Alta proteína", "Sin azúcar"], ingredients: ["2 huevos frescos", "2 tostadas integrales", "60g salmón ahumado", "½ aguacate", "Limón", "Eneldo fresco", "Vinagre para escalfar"], instructions: "Tuesta el pan. Escalfa los huevos 3-4 min en agua con vinagre. Monta: tostada → aguacate → salmón → huevo. Decora con eneldo." },
];

const SHOPPING_LIST = [
  { category: "Proteínas",          color: "#3B82F6", icon: "🥩", items: [{ name: "Pechuga de pollo", qty: "500g", checked: true }, { name: "Salmón fresco", qty: "300g", checked: true }, { name: "Atún al natural", qty: "2 latas", checked: false }, { name: "Pavo en lonchas", qty: "200g", checked: false }, { name: "Huevos", qty: "12 uds.", checked: false }] },
  { category: "Granos y cereales",   color: "#F59E0B", icon: "🌾", items: [{ name: "Avena integral", qty: "500g", checked: true }, { name: "Quinoa", qty: "400g", checked: false }, { name: "Arroz integral", qty: "500g", checked: false }, { name: "Tortillas integrales", qty: "1 paquete", checked: false }] },
  { category: "Frutas y verduras",   color: "#10B981", icon: "🥦", items: [{ name: "Espinacas baby", qty: "200g", checked: false }, { name: "Brócoli", qty: "1 pieza", checked: false }, { name: "Plátanos", qty: "6 uds.", checked: false }, { name: "Aguacate", qty: "3 uds.", checked: false }, { name: "Tomates cherry", qty: "250g", checked: false }, { name: "Manzanas", qty: "4 uds.", checked: false }] },
  { category: "Lácteos y altern.",   color: "#8B5CF6", icon: "🥛", items: [{ name: "Leche de almendras", qty: "1L", checked: true }, { name: "Yogur griego 0%", qty: "4 uds.", checked: false }, { name: "Queso cottage", qty: "250g", checked: false }] },
];

const WEEKLY_STATS = [
  { day: "L", kcal: 1820 }, { day: "M", kcal: 1760 }, { day: "X", kcal: 1910 },
  { day: "J", kcal: 1240 }, { day: "V", kcal: 0 },    { day: "S", kcal: 0 },   { day: "D", kcal: 0 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const r = 52, circ = 2 * Math.PI * r;
  const remaining = goal - consumed;
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg width="144" height="144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#DCFCE7" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" stroke="#059669" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-extrabold text-slate-900">{consumed}</div>
        <div className="text-[10px] text-slate-500 font-medium leading-tight">de {goal}</div>
        <div className="text-[10px] text-emerald-600 font-bold">{remaining} rest.</div>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, goal, color, unit }: { label: string; consumed: number; goal: number; color: string; unit: string }) {
  const pct = Math.min((consumed / goal) * 100, 100);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[11px] font-semibold text-slate-700 truncate">{label}</span>
        <span className="text-[10px] text-slate-500 ml-1 shrink-0">{consumed}/{goal}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-5 pt-3 pb-1 text-[11px] font-semibold ${light ? "text-white/80" : "text-slate-700"}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span>●●●</span><span>WiFi</span><span>▮▮▮</span>
      </div>
    </div>
  );
}

function BottomNav({ current, onNavigate }: { current: Screen; onNavigate: (s: Screen) => void }) {
  const tabs: { key: Screen; icon: typeof Home; label: string }[] = [
    { key: "home",     icon: Home,       label: "Inicio"  },
    { key: "planner",  icon: Calendar,   label: "Plan"    },
    { key: "recipes",  icon: BookOpen,   label: "Recetas" },
    { key: "shopping", icon: ShoppingBag,label: "Compras" },
    { key: "profile",  icon: User,       label: "Perfil"  },
  ];
  return (
    <div className="flex items-center justify-around px-2 py-2 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map(({ key, icon: Icon, label }) => {
        const active = current === key;
        return (
          <button key={key} onClick={() => onNavigate(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${active ? "text-emerald-600" : "text-slate-400"}`}>
            <div className={`p-1 rounded-xl transition-all ${active ? "bg-emerald-50" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            </div>
            <span className={`text-[9px] font-semibold ${active ? "text-emerald-600" : "text-slate-400"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SCREEN: SPLASH ───────────────────────────────────────────────────────────
function SplashScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="h-full flex flex-col" style={{ background: "linear-gradient(160deg,#064E3B 0%,#065F46 45%,#059669 85%,#34D399 100%)" }}>
      <StatusBar light />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-72 h-72 rounded-full border border-white/10 absolute -top-20 -right-20" />
        <div className="w-48 h-48 rounded-full border border-white/10 absolute -top-4 -right-4" />
        <div className="w-56 h-56 rounded-full border border-white/10 absolute bottom-20 -left-24" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <div className="w-24 h-24 rounded-[28px] bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center mb-6 shadow-xl">
          <Leaf className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">NutriCore</h1>
        <p className="text-emerald-200 text-center text-sm font-medium mb-10">Tu núcleo de nutrición inteligente</p>
        <div className="flex gap-8">
          {[["10K+","Usuarios"],["500+","Recetas"],["98%","Satisfacción"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-xl font-extrabold text-white">{v}</div>
              <div className="text-[11px] text-emerald-300 font-medium">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 pb-10 space-y-3 relative z-10">
        <button onClick={() => onNavigate("auth")}
          className="w-full bg-white text-emerald-800 font-bold py-4 rounded-2xl text-[15px] shadow-lg active:scale-95 transition-transform">
          Comenzar ahora
        </button>
        <button onClick={() => onNavigate("auth")}
          className="w-full text-white/75 font-semibold py-2 text-sm">
          Ya tengo una cuenta →
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: AUTH (▶ change 5 — uses real signIn / signUp) ───────────────────
function AuthScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]     = useState<"login" | "register">("login");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Completa todos los campos."); return; }
    setBusy(true); setError("");
    try {
      if (mode === "login") {
        await signIn(email, password);
        // ▶ change 3 — redirect handled by useEffect in AppShell
      } else {
        if (!name) { setError("Ingresa tu nombre."); setBusy(false); return; }
        await signUp(email, password, name);
        onNavigate("onboarding");
      }
    } catch {
      setError("Error al autenticar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <StatusBar />
      <div className="px-6 pt-6 pb-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {mode === "login" ? "Bienvenida de vuelta" : "Crear cuenta"}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {mode === "login" ? "Accede a tu plan nutricional" : "Empieza tu viaje saludable"}
        </p>
      </div>
      <div className="mx-6 flex bg-slate-100 rounded-2xl p-1 mb-5">
        {(["login","register"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>
            {m === "login" ? "Iniciar sesión" : "Registrarse"}
          </button>
        ))}
      </div>
      <div className="px-6 space-y-3 flex-1">
        {mode === "register" && (
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">Nombre completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Valentina García"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors" />
          </div>
        )}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">Correo electrónico</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block uppercase tracking-wide">Contraseña</label>
          <input type="password" value={password} onChange={e => setPass(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition-colors" />
        </div>
        {mode === "login" && (
          <button className="text-emerald-600 text-sm font-semibold">¿Olvidaste tu contraseña?</button>
        )}
        {error && <p className="text-red-500 text-xs font-semibold bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <button onClick={handleSubmit} disabled={busy}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform disabled:opacity-60">
          {busy ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta gratis"}
        </button>
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">o continúa con</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <button className="w-full border border-slate-200 py-3.5 rounded-2xl text-sm font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
          <span className="text-base font-black text-blue-500">G</span> Continuar con Google
        </button>
      </div>
      <div className="h-6" />
    </div>
  );
}

// ─── SCREEN: ONBOARDING (▶ change 8 — saves profile on finish) ───────────────
function OnboardingScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [diet, setDiet] = useState<string[]>([]);
  // Captured form values
  const [onbName,     setOnbName]     = useState("");
  const [onbAge,      setOnbAge]      = useState("28");
  const [onbSex,      setOnbSex]      = useState("femenino");
  const [onbHeight,   setOnbHeight]   = useState("165");
  const [onbWeight,   setOnbWeight]   = useState("62");
  const [onbGoalWt,   setOnbGoalWt]   = useState("57");
  const [onbActivity, setOnbActivity] = useState("moderado");
  const [onbAllergies,setOnbAllergies]= useState<string[]>([]);
  const totalSteps = 5;

  // Mapeos de UI text -> DB enum values
  const sexMap: { [key: string]: "masculino" | "femenino" | "otro" } = {
    "♀ Mujer": "femenino",
    "♂ Hombre": "masculino",
  };
  const activityMap: { [key: string]: "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo" } = {
    "Sedentario": "sedentario",
    "Moderado (1-3 días/sem)": "moderado",
    "Activo (4-5 días/sem)": "activo",
    "Muy activo (6-7 días/sem)": "muy_activo",
  };
  const goalMap: { [key: string]: "bajar_peso" | "mantener" | "ganar_musculo" | "mejorar_salud" } = {
    "lose": "bajar_peso",
    "maintain": "mantener",
    "gain": "ganar_musculo",
    "health": "mejorar_salud",
  };

  const finishOnboarding = async () => {
      const dbGoal = goalMap[goal] || "mantener";
      const dbActivity = activityMap[onbActivity] || "moderado";
      const dbSex = sexMap[onbSex] || "femenino";

    await updateProfile({
      full_name:      onbName || undefined,
      age:            parseInt(onbAge) || undefined,
      weight_kg:      parseFloat(onbWeight) || undefined,
      height_cm:      parseFloat(onbHeight) || undefined,
      sex:            dbSex,
      activity_level: dbActivity,
      goal:           dbGoal,
      diet_type:      diet.join(", ") || "Omnívoro",
      allergies:      onbAllergies.length > 0 ? onbAllergies : null,
      calories_goal:  1850,
      streak_days:    0,
    });
    onNavigate("home");
  };

  const goals = [
    { id: "lose",   icon: "📉", label: "Bajar de peso" },
    { id: "maintain", icon: "⚖️", label: "Mantener peso" },
    { id: "gain",   icon: "💪", label: "Ganar músculo" },
    { id: "health", icon: "❤️", label: "Mejorar salud" },
  ];
  const diets = ["Omnívoro", "Vegetariano", "Vegano", "Sin gluten", "Sin lactosa", "Cetogénica", "Mediterránea", "Paleo"];
  const steps = [
    {
      title: "¿Cuál es tu nombre?", subtitle: "Personalizaremos tu experiencia",
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Nombre</label>
            <input defaultValue="Valentina" className="w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Edad</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50">
                <span className="flex-1 font-bold text-slate-800">28</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Sexo</label>
              <div className="flex gap-2">
                <button className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold">♀ Mujer</button>
                <button className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">♂ Hombre</button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Tu cuerpo", subtitle: "Para calcular tus necesidades calóricas",
      content: (
        <div className="space-y-4">
          {[{ label: "Altura (cm)", value: "165", unit: "cm" }, { label: "Peso actual (kg)", value: "62", unit: "kg" }, { label: "Peso objetivo (kg)", value: "57", unit: "kg" }].map(f => (
            <div key={f.label}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{f.label}</label>
              <div className="flex items-center px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50">
                <span className="flex-1 font-bold text-slate-800 text-lg">{f.value}</span>
                <span className="text-slate-400 font-semibold">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "¿Cuál es tu objetivo?", subtitle: "Crearemos un plan adaptado a ti",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {goals.map(g => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${goal === g.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white"}`}>
              <div className="text-3xl mb-2">{g.icon}</div>
              <div className={`text-xs font-bold ${goal === g.id ? "text-emerald-700" : "text-slate-700"}`}>{g.label}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Preferencias alimenticias", subtitle: "Selecciona todo lo que aplique",
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {diets.map(d => {
              const sel = diet.includes(d);
              return (
                <button key={d} onClick={() => setDiet(sel ? diet.filter((x: string) => x !== d) : [...diet, d])}
                  className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${sel ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
                  {d}
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Alergias o restricciones</label>
            <input placeholder="ej. nueces, mariscos, gluten..." className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-emerald-400 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Nivel de actividad física</label>
            <div className="space-y-2">
              {["Sedentario", "Moderado (1-3 días/sem)", "Activo (4-5 días/sem)", "Muy activo (6-7 días/sem)"].map((lv, i) => (
                <button key={lv} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${i === 1 ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 1 ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                    {i === 1 && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-xs font-semibold ${i === 1 ? "text-emerald-700" : "text-slate-700"}`}>{lv}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "¡Todo listo! 🎉", subtitle: "Tu plan nutricional está siendo creado",
      content: (
        <div className="text-center py-4">
          <div className="w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-14 h-14 text-emerald-600" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">Plan personalizado listo</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">Hemos creado un plan de <span className="font-bold text-emerald-600">1.850 kcal/día</span> adaptado a tus objetivos y preferencias.</p>
          <div className="grid grid-cols-3 gap-3">
            {[["130g","Proteínas","#3B82F6"],["185g","Carbohidratos","#F59E0B"],["52g","Grasas","#EC4899"]].map(([v,l,c]) => (
              <div key={l} className="rounded-2xl p-3" style={{ background: `${c}15` }}>
                <div className="text-base font-extrabold" style={{ color: c }}>{v}</div>
                <div className="text-[10px] text-slate-600 font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  const current = steps[step];
  return (
    <div className="h-full bg-white flex flex-col">
      <StatusBar />
      <div className="px-6 pt-2 pb-4">
        <div className="flex items-center justify-between mb-5">
          {step > 0
            ? <button onClick={() => setStep((s: number) => s - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100"><ArrowLeft size={18} className="text-slate-600" /></button>
            : <div />}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-emerald-600" : i < step ? "w-3 bg-emerald-300" : "w-3 bg-slate-200"}`} />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400">{step + 1}/{totalSteps}</span>
        </div>
        <div className="mb-1 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">
          <Leaf size={12} /> NutriCore
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{current.title}</h2>
        <p className="text-slate-500 text-sm mt-0.5 mb-5">{current.subtitle}</p>
        <div className="overflow-y-auto max-h-[480px]" style={{ scrollbarWidth: "none" }}>
          {current.content}
        </div>
      </div>
      <div className="px-6 pb-8 mt-auto">
        <button
          onClick={() => step < totalSteps - 1 ? setStep((s: number) => s + 1) : finishOnboarding()}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
          {step < totalSteps - 1 ? "Continuar →" : "Ir a mi plan"}
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN: HOME (▶ change 6 — real user name from profile) ─────────────────
function HomeScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile } = useAuth();
  const [meals, setMeals] = useState(TODAY_MEALS);
  const toggle = (id: number) => setMeals((ms: Meal[]) => ms.map((m: Meal) => m.id === id ? { ...m, completed: !m.completed } : m));
  // Real values with mock fallback while profile loads
  const userName    = profile?.full_name?.split(" ")[0] ?? USER.name;
  const calorieGoal = profile?.calories_goal ?? USER.calories.goal;

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Jueves, 22 Mayo</p>
            <h2 className="text-xl font-extrabold text-slate-900">Buenos días, {userName} 👋</h2>
          </div>
          <div className="relative">
            <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Bell size={18} className="text-slate-600" />
            </button>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">2</span>
            </div>
          </div>
        </div>
        {/* Streak */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Flame size={16} className="text-amber-500" />
          <span className="text-xs font-bold text-amber-700">Racha de {USER.streak} días · ¡Sigue así!</span>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Calorie card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Calorías hoy</h3>
              <p className="text-xs text-slate-500">Meta diaria: {calorieGoal} kcal</p>
            </div>
            <button onClick={() => onNavigate("stats")} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Ver progreso</button>
          </div>
          <div className="flex items-center gap-5">
            <CalorieRing consumed={USER.calories.consumed} goal={calorieGoal} />
            <div className="flex-1 space-y-3">
              {Object.values(USER.macros).map(m => (
                <MacroBar key={m.label} label={m.label} consumed={m.consumed} goal={m.goal} color={m.color} unit={m.unit} />
              ))}
            </div>
          </div>
        </div>

        {/* Water tracker */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-slate-900">Hidratación</span>
            </div>
            <span className="text-xs font-bold text-blue-600">{USER.water.consumed}/{USER.water.goal} vasos</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: USER.water.goal }).map((_, i) => (
              <div key={i} className={`flex-1 h-7 rounded-lg transition-all ${i < USER.water.consumed ? "bg-blue-400" : "bg-slate-100"}`} />
            ))}
          </div>
        </div>

        {/* Today's meals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Comidas de hoy</h3>
            <button onClick={() => onNavigate("planner")} className="text-xs font-bold text-emerald-600">Ver plan →</button>
          </div>
          <div className="space-y-2.5">
            {meals.map((m: Meal) => (
              <div key={m.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${m.completed ? "border-emerald-100" : "border-slate-100"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${m.completed ? "bg-emerald-50" : "bg-slate-50"}`}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{m.type}</span>
                      <span className="text-[10px] text-slate-400">· {m.time}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">{m.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[11px] text-slate-500 font-semibold">{m.kcal} kcal</span>
                      <span className="text-[11px] text-blue-500 font-semibold">P:{m.macros.protein}g</span>
                      <span className="text-[11px] text-amber-500 font-semibold">C:{m.macros.carbs}g</span>
                    </div>
                  </div>
                  <button onClick={() => toggle(m.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${m.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick access */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Acceso rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🛒", label: "Lista de compras", action: "shopping" as Screen, color: "#10B981" },
              { icon: "📊", label: "Mi progreso",       action: "stats" as Screen,    color: "#3B82F6" },
            ].map(({ icon, label, action, color }) => (
              <button key={label} onClick={() => onNavigate(action)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left flex items-center gap-3 active:scale-95 transition-transform">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${color}18` }}>{icon}</div>
                <span className="text-xs font-bold text-slate-800">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── SCREEN: PLANNER ─────────────────────────────────────────────────────────
function PlannerScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [day, setDay] = useState("J");
  const dayMeals = WEEK_PLAN[day] ?? [];
  const totalKcal = dayMeals.reduce((s, m) => s + m.kcal, 0);

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white px-5 pt-2 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Plan semanal</h2>
          <button className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <RefreshCw size={16} className="text-slate-600" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {WEEK_DAYS.map(d => (
            <button key={d.key} onClick={() => setDay(d.key)}
              className={`flex flex-col items-center min-w-[44px] py-2.5 px-2 rounded-2xl transition-all ${day === d.key ? "bg-emerald-600 text-white" : d.today ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200" : "bg-slate-100 text-slate-600"}`}>
              <span className="text-[10px] font-semibold">{d.label}</span>
              <span className="text-sm font-extrabold mt-0.5">{d.date}</span>
              {d.today && day !== d.key && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Day summary */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total del día</p>
            <p className="text-xl font-extrabold text-slate-900">{totalKcal} <span className="text-sm font-semibold text-slate-500">kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-semibold">Meta</p>
            <p className="text-lg font-extrabold text-emerald-600">{USER.calories.goal} kcal</p>
          </div>
        </div>

        <div className="space-y-3">
          {dayMeals.map(m => (
            <div key={m.id} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${m.completed ? "bg-emerald-50" : "bg-slate-50"}`}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{m.type}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">{m.time}h</span>
                    {m.completed && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ Completado</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{m.name}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{m.kcal} kcal · P{m.macros.protein}g · C{m.macros.carbs}g · G{m.macros.fat}g</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl border-2 border-emerald-200 text-emerald-700 text-xs font-bold bg-emerald-50 flex items-center justify-center gap-1.5">
                  <Check size={12} /> Confirmar
                </button>
                <button className="flex-1 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5">
                  <RefreshCw size={12} /> Reemplazar
                </button>
                <button className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping list shortcut */}
        <button onClick={() => onNavigate("shopping")}
          className="w-full mt-4 bg-emerald-600 text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
          <ShoppingBag size={16} /> Ver lista de compras
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── SCREEN: RECIPES ─────────────────────────────────────────────────────────
function RecipesScreen({ onNavigate, onSelectRecipe }: { onNavigate: (s: Screen) => void; onSelectRecipe: (r: Recipe) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const cats = ["Todos", "Desayuno", "Almuerzo", "Cena", "Snack"];
  const shown = RECIPES.filter(r =>
    (filter === "Todos" || r.category === filter) &&
    (search === "" || r.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white px-5 pt-2 pb-4 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 mb-3">Recetas</h2>
        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-3 mb-3">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar recetas..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === c ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4">
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
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-extrabold text-emerald-600">{r.calories}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">kcal</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── SCREEN: RECIPE DETAIL ────────────────────────────────────────────────────
function RecipeDetailScreen({ recipe, onNavigate }: { recipe: Recipe; onNavigate: (s: Screen) => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="h-full overflow-y-auto bg-white" style={{ scrollbarWidth: "none" }}>
      <div className="relative h-56 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${recipe.color}40, ${recipe.color}15)` }}>
        <StatusBar />
        <div className="absolute inset-x-0 top-8 flex justify-between px-5">
          <button onClick={() => onNavigate("recipes")} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <button onClick={() => setSaved(!saved)} className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm">
            <Star size={18} className={saved ? "text-amber-400 fill-amber-400" : "text-slate-500"} />
          </button>
        </div>
        <div className="text-8xl mt-4">{recipe.emoji}</div>
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
            <div><div className="text-lg font-extrabold text-blue-600">{recipe.macros.protein}g</div><div className="text-[10px] text-slate-500 font-semibold">Proteína</div></div>
            <div><div className="text-lg font-extrabold text-amber-500">{recipe.macros.carbs}g</div><div className="text-[10px] text-slate-500 font-semibold">Carbos</div></div>
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

        <button className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${recipe.color}, ${recipe.color}cc)` }}>
          Añadir al plan semanal
        </button>
        <div className="h-6" />
      </div>
    </div>
  );
}

// ─── SCREEN: SHOPPING ─────────────────────────────────────────────────────────
function ShoppingScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [list, setList] = useState(SHOPPING_LIST);
  const totalItems = list.reduce((s: number, c: typeof SHOPPING_LIST[0]) => s + c.items.length, 0);
  const checkedItems = list.reduce((s: number, c: typeof SHOPPING_LIST[0]) => s + c.items.filter((i: typeof SHOPPING_LIST[0]['items'][0]) => i.checked).length, 0);
  const toggle = (ci: number, ii: number) => setList((prev: typeof SHOPPING_LIST) =>
    prev.map((c, cIdx: number) => cIdx !== ci ? c : { ...c, items: c.items.map((it, iIdx: number) => iIdx !== ii ? it : { ...it, checked: !it.checked }) })
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white px-5 pt-2 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-slate-900">Lista de compras</h2>
          <button onClick={() => onNavigate("planner")} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            Del plan ↗
          </button>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-800">{checkedItems} de {totalItems} artículos</span>
            <span className="text-xs font-bold text-emerald-600">{Math.round((checkedItems / totalItems) * 100)}%</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(checkedItems / totalItems) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {list.map((cat: typeof SHOPPING_LIST[0], ci: number) => (
          <div key={cat.category} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <span className="text-xl">{cat.icon}</span>
              <h3 className="text-sm font-extrabold text-slate-900">{cat.category}</h3>
              <div className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                {cat.items.filter((i: typeof SHOPPING_LIST[0]['items'][0]) => i.checked).length}/{cat.items.length}
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {cat.items.map((item: typeof SHOPPING_LIST[0]['items'][0], ii: number) => (
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
    </div>
  );
}

// ─── SCREEN: PROFILE (▶ change 7 — real profile data + real signOut) ─────────
function ProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, signOut } = useAuth();
  // Real values with mock fallbacks
  const name    = profile?.full_name  ?? USER.name;
  const age     = profile?.age        ?? USER.age;
  const weight  = profile?.weight_kg  ?? USER.weight;
  const height  = profile?.height_cm  ?? USER.height;
  const goal    = profile?.goal       ?? USER.goal;
  const streak  = profile?.streak_days ?? USER.streak;
  const calGoal = profile?.calories_goal ?? USER.calories.goal;
  const restrictions = profile?.allergies
    ? Array.isArray(profile.allergies) ? profile.allergies : []
    : ["Sin gluten parcial", "Bajo en sodio", "Rica en proteínas"];

  const handleSignOut = async () => {
    await signOut();
    onNavigate("splash");
  };
  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-2 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-slate-900">Mi perfil</h2>
          <div className="flex gap-2">
            <button onClick={() => onNavigate("settings")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center"><Settings size={16} className="text-slate-600" /></button>
            <button className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center"><Edit3 size={16} className="text-slate-600" /></button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-extrabold text-white">V</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500 font-medium">{age} años · {height}cm · {weight}kg</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                <Flame size={11} className="text-amber-500" />
                <span className="text-[11px] font-bold text-amber-700">{streak} días</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                <Target size={11} className="text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700">{goal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[["22.8","IMC","normal"],[String(calGoal),"kcal/día","meta"],[String(streak),"días","racha"]].map(([v,u,l]) => (
            <div key={u} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <div className="text-xl font-extrabold text-slate-900">{v}</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">{u}</div>
              <div className="text-[10px] text-slate-400 font-medium">{l}</div>
            </div>
          ))}
        </div>

        {/* Goals */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Metas nutricionales</h3>
          <div className="space-y-3">
            {Object.values(USER.macros).map(m => (
              <MacroBar key={m.label} label={m.label} consumed={m.consumed} goal={m.goal} color={m.color} unit={m.unit} />
            ))}
          </div>
        </div>

        {/* Diet & restrictions */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Dieta y restricciones</h3>
          <div className="flex flex-wrap gap-2">
            {[profile?.activity_level ?? "Moderado", profile?.diet_type ?? "Mediterránea", ...restrictions].map(t => (
              <span key={t} className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {/* Nutritionist notes */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen size={14} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Notas del nutricionista</h3>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 border-l-4 border-blue-400">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              "Prioriza proteínas en el desayuno. Evita carbohidratos simples después de las 7pm. Hidratación mínima 2L/día. Incluir omega-3 tres veces por semana."
            </p>
            <p className="text-[10px] text-blue-500 font-bold mt-2">Dra. García · 14 Mayo 2025</p>
          </div>
        </div>

        {/* Settings links */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {[
            { icon: BarChart2, label: "Mi progreso y estadísticas", action: "stats" as Screen, color: "#3B82F6" },
            { icon: Settings, label: "Ajustes de la app", action: "settings" as Screen, color: "#64748B" },
          ].map(({ icon: Icon, label, action, color }) => (
            <button key={label} onClick={() => onNavigate(action)}
              className="w-full flex items-center gap-4 px-4 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-800 text-left">{label}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>

        <button onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-bold text-sm active:scale-95 transition-transform">
          Cerrar sesión
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── SCREEN: STATS ────────────────────────────────────────────────────────────
function StatsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const GOAL = USER.calories.goal;
  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white px-5 pt-2 pb-4 shadow-sm">
        <StatusBar />
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => onNavigate("home")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Mi progreso</h2>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Weekly overview */}
        <div className="grid grid-cols-3 gap-3">
          {[["14","🔥","Días de racha"],["1780","kcal","Promedio semanal"],["87%","✓","Comidas completadas"]].map(([v,ic,l]) => (
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
            <span className="text-xs text-slate-500 font-semibold">Meta: {GOAL} kcal</span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={WEEKLY_STATS} barSize={28} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 2200]} />
              <ReferenceLine y={GOAL} stroke="#059669" strokeDasharray="4 3" strokeWidth={1.5} />
              <Bar dataKey="kcal" radius={[8, 8, 4, 4]}>
                {WEEKLY_STATS.map((entry, i) => (
                  <Cell key={i} fill={entry.kcal === 0 ? "#E2E8F0" : entry.kcal > GOAL ? "#F97316" : "#059669"} />
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
              { label: "Proteínas", consumed: 78, goal: 130, color: "#3B82F6", pct: 60 },
              { label: "Carbohidratos", consumed: 142, goal: 185, color: "#F59E0B", pct: 77 },
              { label: "Grasas", consumed: 31, goal: 52, color: "#EC4899", pct: 60 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">{m.label}</span>
                  <span className="font-semibold text-slate-500">{m.consumed}g / {m.goal}g</span>
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
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">-2.1 kg ↓</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-20">
            {[64.1, 63.5, 63.2, 62.8, 62.5, 62.2, 62.0].map((w, i) => {
              const h = ((w - 61) / (65 - 61)) * 100;
              return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-emerald-100" style={{ height: `${h}%`, minHeight: 8 }}>
                    <div className="w-full h-1 rounded-t-lg bg-emerald-500" />
                  </div>
                  {i === 6 && <span className="text-[10px] font-bold text-emerald-600">{w}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-semibold">
            <span>Inicio: 64.1 kg</span><span>Hoy: 62.0 kg</span><span>Meta: 57 kg</span>
          </div>
        </div>

        {/* Achievement badges */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3">Logros desbloqueados</h3>
          <div className="flex gap-3">
            {[["🔥","Racha 14d"],["🥗","10 recetas"],["💧","Hidratación"],["⚡","Meta semanal"]].map(([ic, l]) => (
              <div key={l} className="flex-1 bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
                <div className="text-2xl mb-1">{ic}</div>
                <div className="text-[9px] font-bold text-amber-700 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── SCREEN: SETTINGS ─────────────────────────────────────────────────────────
function SettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [notifs, setNotifs] = useState(true);
  const [dark, setDark] = useState(false);
  const sections = [
    { title: "Cuenta", items: [
      { icon: User, label: "Editar perfil", sub: "Valentina García", color: "#059669" },
      { icon: Target, label: "Mis objetivos", sub: "Perder peso · 1850 kcal", color: "#3B82F6" },
    ]},
    { title: "Preferencias", items: [
      { icon: Bell, label: "Notificaciones", sub: "Recordatorios de comidas", color: "#F59E0B", toggle: true, togVal: notifs, onTog: () => setNotifs((v: boolean) => !v) },
      { icon: Zap, label: "Modo oscuro", sub: "Apariencia", color: "#8B5CF6", toggle: true, togVal: dark, onTog: () => setDark((v: boolean) => !v) },
    ]},
    { title: "Datos y privacidad", items: [
      { icon: Activity, label: "Exportar datos", sub: "CSV / PDF", color: "#10B981" },
      { icon: X, label: "Eliminar cuenta", sub: "Acción irreversible", color: "#EF4444" },
    ]},
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50" style={{ scrollbarWidth: "none" }}>
      <div className="bg-white px-5 pt-2 pb-4 shadow-sm">
        <StatusBar />
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate("profile")} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900">Ajustes</h2>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-5">
        {sections.map(sec => (
          <div key={sec.title}>
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 px-1">{sec.title}</p>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {sec.items.map((item: any, i: number) => {
                const { icon: Icon, label, sub, color, toggle, togVal, onTog } = item as any;
                return (
                  <div key={label} className={`flex items-center gap-4 px-4 py-3.5 ${i < sec.items.length - 1 ? "border-b border-slate-50" : ""}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
                    </div>
                    {toggle ? (
                      <button onClick={onTog}
                        className={`w-12 h-6 rounded-full transition-all relative ${togVal ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${togVal ? "left-6" : "left-0.5"}`} />
                      </button>
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
            <Leaf size={20} className="text-emerald-600" />
          </div>
          <p className="text-sm font-extrabold text-slate-900">NutriCore</p>
          <p className="text-xs text-slate-400 font-medium">Versión 1.0.0 MVP</p>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── LAYOUT: MAIN APP (with bottom nav) ───────────────────────────────────────
function MainApp({ screen, onNavigate, selectedRecipe }: {
  screen: Screen; onNavigate: (s: Screen, data?: { recipe?: Recipe }) => void; selectedRecipe: Recipe | null;
}) {
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-hidden">
        {screen === "home"     && <HomeScreen onNavigate={onNavigate} />}
        {screen === "planner"  && <PlannerScreen onNavigate={onNavigate} />}
        {screen === "recipes"  && <RecipesScreen onNavigate={onNavigate} onSelectRecipe={r => onNavigate("recipeDetail", { recipe: r })} />}
        {screen === "shopping" && <ShoppingScreen onNavigate={onNavigate} />}
        {screen === "profile"  && <ProfileScreen onNavigate={onNavigate} />}
      </div>
      <BottomNav current={screen} onNavigate={onNavigate} />
    </div>
  );
}

const MAIN_SCREENS: Screen[] = ["home", "planner", "recipes", "shopping", "profile"];

// ─── APP SHELL (▶ changes 2-4 — uses useAuth, redirect effect, loading screen)
function AppShell() {
  const { user, profile, loading } = useAuth();
  const [screen, setScreen]              = useState<Screen>("splash");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const navigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    setScreen(to);
  };

  // ▶ change 3 — auto-redirect based on session state
  useEffect(() => {
    if (!loading) {
      if (user && (screen === "splash" || screen === "auth")) {
        const hasProfile = profile?.goal != null;
        setScreen(hasProfile ? "home" : "onboarding");
      }
      if (!user && !["splash", "auth"].includes(screen)) {
        setScreen("splash");
      }
    }
  }, [user, loading, profile]);

  // ▶ change 4 — loading screen while session check runs
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0F172A,#082f1e,#0F172A)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/60 flex items-center justify-center">
            <Leaf className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-emerald-400 text-sm font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#0F172A 0%,#082f1e 50%,#0F172A 100%)" }}>
      {/* Ambient circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#059669,transparent)", top: "10%", left: "5%" }} />
        <div className="absolute w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#34D399,transparent)", bottom: "15%", right: "10%" }} />
      </div>

      {/* App title above phone */}
      <div className="relative z-10 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf size={16} className="text-emerald-400" />
          <span className="text-emerald-400 font-extrabold text-sm tracking-widest uppercase">NutriCore</span>
        </div>
        <p className="text-white/40 text-xs font-medium">Tu núcleo de nutrición inteligente · MVP Prototype</p>
      </div>

      {/* Phone frame */}
      <div className="relative z-10" style={{ width: 375, height: 780 }}>
        <div className="absolute inset-0 rounded-[48px] border-[10px] border-slate-700 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-slate-800" />
        <div className="absolute left-[-12px] top-[120px] w-[3px] h-10 bg-slate-600 rounded-l" />
        <div className="absolute left-[-12px] top-[170px] w-[3px] h-10 bg-slate-600 rounded-l" />
        <div className="absolute right-[-12px] top-[140px] w-[3px] h-16 bg-slate-600 rounded-r" />
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full z-50" />
        {/* Screen content */}
        <div className="absolute inset-[10px] rounded-[38px] overflow-hidden bg-white">
          {screen === "splash"       && <SplashScreen onNavigate={navigate} />}
          {screen === "auth"         && <AuthScreen onNavigate={navigate} />}
          {screen === "onboarding"   && <OnboardingScreen onNavigate={navigate} />}
          {MAIN_SCREENS.includes(screen) && <MainApp screen={screen} onNavigate={navigate} selectedRecipe={selectedRecipe} />}
          {screen === "recipeDetail" && selectedRecipe && <RecipeDetailScreen recipe={selectedRecipe} onNavigate={navigate} />}
          {screen === "stats"        && <StatsScreen onNavigate={navigate} />}
          {screen === "settings"     && <SettingsScreen onNavigate={navigate} />}
        </div>
      </div>

      {/* Navigation hints */}
      <div className="relative z-10 mt-6 flex gap-4 flex-wrap justify-center">
        {([["splash","Splash"],["auth","Login"],["onboarding","Onboarding"],["home","Dashboard"],["planner","Plan"],["recipes","Recetas"],["shopping","Compras"],["profile","Perfil"],["stats","Progreso"],["settings","Ajustes"]] as [Screen, string][]).map(([s, l]) => (
          <button key={s} onClick={() => setScreen(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${screen === s ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
            {l}
          </button>
        ))}
      </div>
      <p className="relative z-10 mt-3 text-white/25 text-[11px] font-medium">
        Haz clic en los botones para navegar entre pantallas
      </p>
    </div>
  );
}

// ─── ROOT (▶ change 1 — wraps AppShell in AuthProvider) ──────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

