import { useState } from "react";
import { Leaf } from "lucide-react";
import { HashRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";

// ─── TIPOS ───
// Salimos de 'app' con '../' para llegar a la carpeta 'types'
import { Screen, Recipe } from "../types";

// ─── COMPONENTES ───
// Entramos directo a 'components' porque ya estamos en 'app'
import BottomNav from "./components/BottomNav";

// ─── PANTALLAS ───
// Entramos directo a 'screens' porque ya estamos en 'app'
import SplashScreen from "./screens/SplashScreen";
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/Onboardingscreen";
import HomeScreen from "./screens/HomeScreen";
import PlannerScreen from "./screens/PlannerScreen";
import RecipesScreen from "./screens/RecipesScreen";
import RecipeDetailScreen from "./screens/RecipeDetailScreen";
import ShoppingScreen from "./screens/ShoppingScreen";
import ProfileScreen from "./screens/ProfileScreen";
import HealthScreen from "./screens/HealthScreen";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import MyObjetivesScreen from "./screens/ObjetiveScreen";

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
        {screen === "health"   && <HealthScreen onNavigate={onNavigate} />}
      </div>
      <BottomNav current={screen} onNavigate={onNavigate} />
    </div>
  );
}

const MAIN_SCREENS: Screen[] = ["home", "planner", "recipes", "shopping", "profile", "health"];

// ─── CONTENIDO DE LA APP CON ENRUTAMIENTO ──────────────────────────────────────
function AppContent() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const navigate = useNavigate();

  const handleNavigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    navigate(`/${to}`);
  };

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
        {/* Outer border + shadow */}
        <div className="absolute inset-0 rounded-[48px] border-[10px] border-slate-700 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-slate-800" />
        {/* Side buttons */}
        <div className="absolute left-[-12px] top-[120px] w-[3px] h-10 bg-slate-600 rounded-l" />
        <div className="absolute left-[-12px] top-[170px] w-[3px] h-10 bg-slate-600 rounded-l" />
        <div className="absolute right-[-12px] top-[140px] w-[3px] h-16 bg-slate-600 rounded-r" />
        {/* Dynamic island */}
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full z-50" />
        {/* Screen content */}
        <div className="absolute inset-[10px] rounded-[38px] overflow-hidden bg-white">
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<SplashScreen onNavigate={handleNavigate} />} />
            <Route path="/auth" element={<AuthScreen onNavigate={handleNavigate} />} />
            <Route path="/onboarding" element={<OnboardingScreen onNavigate={handleNavigate} />} />
            {MAIN_SCREENS.map(s => (
              <Route key={s} path={`/${s}`} element={<MainApp screen={s} onNavigate={handleNavigate} selectedRecipe={selectedRecipe} />} />
            ))}
            <Route path="/recipeDetail" element={selectedRecipe ? <RecipeDetailScreen recipe={selectedRecipe} onNavigate={handleNavigate} /> : <Navigate to="/recipes" replace />} />
            <Route path="/stats" element={<StatsScreen onNavigate={handleNavigate} />} />
            <Route path="/settings" element={<SettingsScreen onNavigate={handleNavigate} />} />
            <Route path="/editProfile" element={<EditProfileScreen onNavigate={handleNavigate} />} />
            <Route path="/myObjetives" element={<MyObjetivesScreen onNavigate={handleNavigate} />} />
            <Route path="*" element={<Navigate to="/splash" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}