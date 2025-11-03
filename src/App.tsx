import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import { LoginWithGoogle } from "@/features/auth/LoginButton";
import { Today } from "@/features/today/Today";

export function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1>GymApp</h1>
      {!session ? (
        <LoginWithGoogle />
      ) : (
        <>
          <p>Hola {session.user.email}</p>
          <Today />
        </>
      )}
    </div>
  );
}
