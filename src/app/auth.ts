// src/app/auth.ts
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

/** Inicia login con Google y vuelve a la app */
export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin }
  });
  if (error) console.error("Error en login:", error.message);
}

/** Cierra sesión */
export async function logout() {
  await supabase.auth.signOut();
}

/** Obtiene el usuario actual (o null) */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * initAuth: suscribe a cambios de sesión.
 * Devuelve una función para desuscribirse.
 * Si pasas onChange, te notifica el User o null.
 */
export function initAuth(onChange?: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange?.(session?.user ?? null);
  });
  return () => {
    try { subscription?.unsubscribe(); } catch {}
  };
}
