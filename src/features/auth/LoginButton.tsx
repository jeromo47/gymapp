import { supabase } from "@/app/supabase";

export function LoginWithGoogle() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };
  return <button onClick={signIn}>Entrar con Google</button>;
}
