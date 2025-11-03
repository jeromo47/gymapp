import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV, envOk } from "./config";

let supabase: SupabaseClient;

if (envOk()) {
  supabase = createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_ANON!, { auth: { persistSession: true } });
} else {
  // Cliente “dummy” para no romper la app si faltan env
  console.error("[GymApp] Variables de entorno de Supabase ausentes.");
  supabase = createClient("https://example.supabase.co", "ey_invalid_key", {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined as any }
  });
}

export { supabase };
