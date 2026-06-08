import { useState } from "react";
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

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const navigate = (to: Screen, data?: { recipe?: Recipe }) => {
    if (data?.recipe) setSelectedRecipe(data.recipe);
    setScreen(to);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      {screen === "splash"      && <SplashScreen onNavigate={(s) => navigate(s)} />}
      {screen === "auth"        && <AuthScreen onNavigate={(s) => navigate(s)} />}
      {screen === "onboarding"  && <OnboardingScreen onNavigate={(s) => navigate(s)} />}
      {MAIN_SCREENS.includes(screen) && <MainApp screen={screen} onNavigate={navigate} selectedRecipe={selectedRecipe} />}
      {screen === "recipeDetail" && selectedRecipe && <RecipeDetailScreen recipe={selectedRecipe} onNavigate={navigate} />}
      {screen === "stats"       && <StatsScreen onNavigate={(s) => navigate(s)} />}
      {screen === "settings"    && <SettingsScreen onNavigate={(s) => navigate(s as Screen)} />}
      {screen === "editProfile" && <EditProfileScreen onNavigate={(s) => navigate(s as Screen)} />}
      {screen === "myObjetives" && <MyObjetivesScreen onNavigate={(s) => navigate(s as Screen)} />}
      {(screen as string) === "about"       && <AboutScreen onNavigate={(s) => navigate(s as Screen)} />}
    </div>
  );
}