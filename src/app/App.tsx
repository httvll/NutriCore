import { useState } from "react";
import { HashRouter, Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Screen, Recipe } from "../types";
import BottomNav from "./components/BottomNav";
import SplashScreen from "./screens/SplashScreen";
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/OnboardingScreens";
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
import AboutScreen from "./screens/AboutScreen";
import { useAuth } from "../context/AuthContext";

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

function AppContent() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAuth();

  // Extraemos la pantalla actual de la URL
  const screen = (location.pathname.replace("/", "") || "splash") as Screen;

  const handleNavigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    navigate(`/${to}`);
  };

  // Pantalla de carga mientras Supabase restaura la sesión (evita parpadeos al dar Refresh)
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Cargando NutriCore...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen onNavigate={handleNavigate} />} />
        <Route path="/auth" element={<AuthScreen onNavigate={handleNavigate} />} />
        <Route path="/onboarding" element={<OnboardingScreen onNavigate={handleNavigate} />} />
        {MAIN_SCREENS.map(s => (
          <Route key={s} path={`/${s}`} element={<MainApp screen={s as Screen} onNavigate={handleNavigate} selectedRecipe={selectedRecipe} />} />
        ))}
        <Route path="/recipeDetail" element={selectedRecipe ? <RecipeDetailScreen recipe={selectedRecipe} onNavigate={handleNavigate} /> : <Navigate to="/recipes" replace />} />
        <Route path="/stats" element={<StatsScreen onNavigate={handleNavigate} />} />
        <Route path="/settings" element={<SettingsScreen onNavigate={handleNavigate} />} />
        <Route path="/editProfile" element={<EditProfileScreen onNavigate={handleNavigate} />} />
        <Route path="/myObjetives" element={<MyObjetivesScreen onNavigate={handleNavigate} />} />
        <Route path="/about" element={<AboutScreen onNavigate={handleNavigate} />} />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}