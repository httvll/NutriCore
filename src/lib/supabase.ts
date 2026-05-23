// src/lib/supabase.ts
// ─── Cliente Supabase ─────────────────────────────────────────────────────────
// Crea UNA SOLA instancia del cliente y la reutiliza en toda la app.
// Las variables de entorno se leen desde .env.local (nunca las subas a git).

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n" +
    "Crea un archivo .env.local en la raíz del proyecto con esos valores."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
