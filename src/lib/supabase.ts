import { createClient } from "@supabase/supabase-js";

const env = import.meta as unknown as { env: { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string } };
const supabaseUrl = env.env.VITE_SUPABASE_URL;
const supabaseKey = env.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "❌ Faltan variables de entorno: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "Revisa la configuración en Vercel → Settings → Environment Variables."
  );
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string);