import { createClient } from "@supabase/supabase-js";

/**
 * ✅ CONFIGURACIÓN DIRECTA (sin variables de entorno)
 * Pega aquí tu URL y tu Anon Key de Supabase
 */
const SUPABASE_URL = "https://xsatrxcfnhjjpvshtvcr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYXRyeGNmbmhqanB2c2h0dmNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjQ4ODIsImV4cCI6MjA3Nzc0MDg4Mn0.Ptww5fAazSNFsTkOZbnfQWMQuH6SPWEOCxoqWHSYpsc";

/** Validación simple */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("⚠️ Falta configurar SUPABASE_URL o SUPABASE_ANON_KEY en supabase.ts");
}

/** Cliente Supabase listo para usar */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
