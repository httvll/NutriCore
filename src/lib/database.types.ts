// src/lib/database.types.ts
// ─── Tipos TypeScript de la base de datos ────────────────────────────────────
// Representa cada tabla de PostgreSQL. Si usas el CLI de Supabase puedes
// generarlos automáticamente con: npx supabase gen types typescript --local
// Por ahora los declaramos a mano para no depender del CLI.

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "updated_at">;
        Update: Partial<Omit<UserProfile, "id" | "created_at">>;
      };
      weekly_plans: {
        Row: WeeklyPlan;
        Insert: Omit<WeeklyPlan, "id" | "created_at">;
        Update: Partial<Omit<WeeklyPlan, "id" | "created_at">>;
      };
      meal_logs: {
        Row: MealLog;
        Insert: Omit<MealLog, "id" | "logged_at">;
        Update: Partial<Omit<MealLog, "id">>;
      };
      nutritionist_notes: {
        Row: NutritionistNote;
        Insert: Omit<NutritionistNote, "id" | "created_at">;
        Update: Partial<Omit<NutritionistNote, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      activity_level: "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";
      diet_goal: "bajar_peso" | "mantener" | "ganar_musculo" | "mejorar_salud";
    };
  };
}

// ─── Tipos de fila ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;               // UUID — igual al auth.users.id de Supabase
  full_name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  sex: "masculino" | "femenino" | "otro" | null;
  activity_level: Database["public"]["Enums"]["activity_level"] | null;
  goal: Database["public"]["Enums"]["diet_goal"] | null;
  diet_type: string | null;         // "Omnívoro", "Vegano", etc.
  allergies: string[] | null;       // Array JSON: ["gluten", "lácteos"]
  preferred_cuisines: string[] | null;
  disliked_foods: string | null;
  max_cook_time_min: number | null;
  breakfast_time: string | null;    // "08:00"
  lunch_time: string | null;
  snack_time: string | null;
  dinner_time: string | null;
  calories_goal: number | null;
  protein_goal_g: number | null;
  carbs_goal_g: number | null;
  fat_goal_g: number | null;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string;    // "2025-05-19" (ISO date, lunes de la semana)
  plan_data: Json;       // { "L": { desayuno: recipeId, almuerzo: ... }, ... }
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  logged_date: string;   // "2025-05-22"
  meal_slot: "desayuno" | "almuerzo" | "snack" | "cena";
  recipe_id: number;
  recipe_name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  completed: boolean;
  logged_at: string;
}

export interface NutritionistNote {
  id: string;
  user_id: string;
  note_text: string;
  author_name: string;
  note_date: string;
  created_at: string;
}
