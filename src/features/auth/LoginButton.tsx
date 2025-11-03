import { supabase } from "@/app/supabase";

export function LoginWithGoogle() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };
  return (
    <button className="btn primary" onClick={signIn}>
      Entrar con Google
    </button>
  );
}
