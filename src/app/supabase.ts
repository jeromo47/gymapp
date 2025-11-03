import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!; // 👈 tiene que incluir _KEY

if (!url || !anon) {
  console.error("❌ Variables Supabase no configuradas:", { url, anon });
  throw new Error("Supabase URL o KEY no configuradas");
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
