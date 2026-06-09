import { useState } from "react";
import { HashRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
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
  const { user, profile, loading, profileLoading } = useAuth();

  const handleNavigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    navigate(`/${to}`);
  };

  // Pantalla de carga solo la primera vez, si aún no tenemos el perfil en memoria
  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Cargando NutriCore...</p>
      </div>
    );
  }

  // Verificamos si el usuario ya completó el onboarding (tiene una meta)
  const hasCompletedOnboarding = !!profile?.goal;
  const defaultLoggedInRoute = hasCompletedOnboarding ? "/home" : "/onboarding";

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <Routes>
        {/* Rutas Públicas: Si ya hay usuario logueado, lo mandamos a su ruta correspondiente */}
        <Route path="/" element={<Navigate to={user ? defaultLoggedInRoute : "/splash"} replace />} />
        <Route path="/splash" element={user ? <Navigate to={defaultLoggedInRoute} replace /> : <SplashScreen onNavigate={handleNavigate} />} />
        <Route path="/auth" element={user ? <Navigate to={defaultLoggedInRoute} replace /> : <AuthScreen onNavigate={handleNavigate} />} />
        
        {/* Rutas Privadas: Protegemos contra usuarios sin sesión y sin onboarding */}
        <Route path="/onboarding" element={!user ? <Navigate to="/splash" replace /> : (hasCompletedOnboarding ? <Navigate to="/home" replace /> : <OnboardingScreen onNavigate={handleNavigate} />)} />
        {MAIN_SCREENS.map(s => (
          <Route key={s} path={`/${s}`} element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <MainApp screen={s as Screen} onNavigate={handleNavigate} selectedRecipe={selectedRecipe} />)} />
        ))}
        <Route path="/recipeDetail" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : (selectedRecipe ? <RecipeDetailScreen recipe={selectedRecipe} onNavigate={handleNavigate} /> : <Navigate to="/recipes" replace />))} />
        <Route path="/stats" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <StatsScreen onNavigate={handleNavigate} />)} />
        <Route path="/settings" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <SettingsScreen onNavigate={handleNavigate} />)} />
        <Route path="/editProfile" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <EditProfileScreen onNavigate={handleNavigate} />)} />
        <Route path="/myObjetives" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <MyObjetivesScreen onNavigate={handleNavigate} />)} />
        <Route path="/about" element={!user ? <Navigate to="/splash" replace /> : (!hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> : <AboutScreen onNavigate={handleNavigate} />)} />
        <Route path="*" element={<Navigate to={user ? defaultLoggedInRoute : "/splash"} replace />} />
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