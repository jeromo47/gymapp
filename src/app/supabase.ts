import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined; // 👈 _KEY

if (!url || !anon) {
  console.error("❌ Faltan variables de Supabase", {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_ANON_KEY: anon
  });
  throw new Error("Faltan variables: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
