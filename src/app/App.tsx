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
  const { user, profile, loading, profileLoading, profileLoadFailed } = useAuth();

  const handleNavigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    navigate(`/${to}`);
  };

  // Spinner — bloquea la app SOLO en la carga inicial, para evitar parpadeos luego
  if (loading || (user && profileLoading && !profile && !profileLoadFailed)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500">Cargando NutriCore...</p>
      </div>
    );
  }

  // Mostrar error con reintento únicamente si la red o base de datos falló genuinamente
  if (user && profileLoadFailed) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 px-8 text-center">
        <p className="text-slate-700 font-bold text-base mb-2">Error al cargar tu perfil</p>
        <p className="text-slate-400 text-sm mb-6">Revisa tu conexión e intenta de nuevo</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const hasCompletedOnboarding = !!profile?.goal;
  const defaultLoggedInRoute = hasCompletedOnboarding ? "/home" : "/onboarding";

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <Routes>
        <Route path="/" element={<Navigate to={user ? defaultLoggedInRoute : "/splash"} replace />} />
        <Route path="/splash" element={user ? <Navigate to={defaultLoggedInRoute} replace /> : <SplashScreen onNavigate={handleNavigate} />} />
        <Route path="/auth" element={user ? <Navigate to={defaultLoggedInRoute} replace /> : <AuthScreen onNavigate={handleNavigate} />} />
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