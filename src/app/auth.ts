import { supabase } from "@/app/supabase";

export async function initAuth() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (code && state) {
    const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url.toString());
    if (error) throw error;
  }
}
