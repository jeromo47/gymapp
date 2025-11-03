import { supabase } from "@/app/supabase";

export function LoginWithGoogle() {
  const onClick = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // vuelve a tu Netlify
        queryParams: { access_type: "offline", prompt: "consent" }
      }
    });
  };

  return (
    <button className="btn primary" onClick={onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 31.7 29.3 35 24 35c-7 0-12.7-5.7-12.7-12.7S17 9.7 24 9.7c3.2 0 6.2 1.2 8.4 3.2l5.7-5.7C34.7 3.4 29.6 1.3 24 1.3 11.5 1.3 1.3 11.5 1.3 24S11.5 46.7 24 46.7 46.7 36.5 46.7 24c0-1.2-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8c1.8-4 5.7-6.8 10.1-6.8 3.2 0 6.2 1.2 8.4 3.2l5.7-5.7C34.7 3.4 29.6 1.3 24 1.3 15 1.3 7.5 6.7 4 14.7z"/>
        <path fill="#4CAF50" d="M24 46.7c5.2 0 10-2 13.6-5.3l-6.3-5.2c-2 1.3-4.5 2-7.3 2-5.3 0-9.9-3.3-11.6-8l-6.6 5.1c3.4 7.9 11.2 13.4 20.2 13.4z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-4.7 6.2-8.3 6.2-5.3 0-9.9-3.3-11.6-8l-6.6 5.1C11 37 17 41 24 41c10 0 18.1-8.1 18.1-18.1 0-1.2-.1-2.3-.5-3.4z"/>
      </svg>
      <span>Entrar con Google</span>
    </button>
  );
}
