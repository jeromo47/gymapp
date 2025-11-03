import { supabase } from "@/app/supabase";

/**
 * Intercambia el ?code= de Google por una sesión
 * y limpia la URL para evitar bucles/recargas raras.
 */
export async function initAuth(): Promise<void> {
  const url = new URL(window.location.href);
  const hasCode = url.searchParams.get("code");
  const hasState = url.searchParams.get("state");
  if (hasCode && hasState) {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    // Limpia la query para no repetir el intercambio
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.toString());
    if (error) {
      console.error("OAuth exchange error:", error.message);
      throw error;
    }
  }
}
