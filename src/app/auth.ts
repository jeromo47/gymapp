import { supabase } from "./supabase";

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin // vuelve a la app después de logear
    }
  });
  if (error) console.error("Error en login:", error.message);
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
