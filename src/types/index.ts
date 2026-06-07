export interface Recipe {
  id: number; name: string; category: string; emoji: string; color: string;
  calories: number; time: string; rating: number; difficulty: string;
  macros: { protein: number; carbs: number; fat: number };
  tags: string[]; ingredients: string[]; instructions: string;
}
 
export interface Meal {
  id: number; type: string; emoji: string; time: string;
  name: string; kcal: number; completed: boolean;
  macros: { protein: number; carbs: number; fat: number };
  items: string[];
}
 
export interface LabValue {
  name: string; value: number; unit: string;
  refMin: number; refMax: number; date: string;
}
 
export interface LabResult {
  id: string; date: string; type: string;
  typeColor: string; typeIcon: string; fileName: string;
  values: LabValue[];
}

export type Screen = 
  | "splash" 
  | "auth" 
  | "onboarding" 
  | "home" 
  | "planner" 
  | "recipes" 
  | "recipeDetail" 
  | "shopping" 
  | "profile" 
  | "health" 
  | "stats" 
  | "settings"
  | "editProfile"    
  | "myObjetives";

export interface Recipe {
  id: number; name: string; category: string; emoji: string; color: string;
  calories: number; time: string; rating: number; difficulty: string;
  macros: { protein: number; carbs: number; fat: number };
  tags: string[]; ingredients: string[]; instructions: string;
}

export interface Meal {
  id: number; type: string; emoji: string; time: string;
  name: string; kcal: number; completed: boolean;
  macros: { protein: number; carbs: number; fat: number };
  items: string[];
}

export interface LabValue {
  name: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  date: string;
}

export interface LabResult {
  id: string;
  date: string;
  type: string;
  typeColor: string;
  typeIcon: string;
  fileName: string;
  values: LabValue[];
}
