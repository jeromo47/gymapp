import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import { initAuth } from "@/app/auth";
import { envOk, missingEnvMessage } from "@/app/config";
import { LoginWithGoogle } from "@/features/auth/LoginButton";
import { Spinner } from "@/components/Spinner";
import { Today } from "@/features/today/Today";
import "@/styles.css";

type SBSession = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SBSession | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ok = envOk();

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        if (!ok) throw new Error(missingEnvMessage());
        await initAuth();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session ?? null);
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        unsub = () => sub.subscription.unsubscribe();
      } catch (e: any) {
        setErr(e?.message ?? "Error de inicio");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub();
  }, [ok]);

  if (loading)
    return (
      <div className="container">
        <div className="card glass" style={{ textAlign: "center" }}>
          <Spinner />
          <p className="muted">Cargando…</p>
        </div>
      </div>
    );

  return (
    <div className="container">
      {!ok && <Banner kind="error" msg={missingEnvMessage()} />}
      {err && ok && <Banner kind="error" msg={err} />}
      {!session ? (
        <div className="card glass" style={{ textAlign: "center" }}>
          <h2>Bienvenido a <span className="brand">GymApp</span></h2>
          <p className="muted">Inicia sesión con Google para sincronizar tus entrenos.</p>
          {ok && <LoginWithGoogle />}
        </div>
      ) : (
        <Today />
      )}
    </div>
  );
}

function Banner({ kind, msg }: { kind: "error" | "info"; msg: string }) {
  return <div className={`banner ${kind}`}>{msg}</div>;
}
