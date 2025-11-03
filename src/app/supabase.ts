import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV, envOk } from "./config";

let supabase: SupabaseClient;

try {
  if (!envOk()) {
    console.warn("[GymApp] Variables de entorno ausentes. Cliente dummy.");
    supabase = createClient("https://example.supabase.co", "ey_invalid_key", {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined as any }
    });
  } else {
    supabase = createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_ANON!, { auth: { persistSession: true } });
  }
} catch (e) {
  console.error("Error creando Supabase client", e);
  supabase = createClient("https://example.supabase.co", "ey_invalid_key", {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined as any }
  });
}

export { supabase };
