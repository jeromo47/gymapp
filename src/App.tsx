// src/App.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import { LoginWithGoogle } from "@/features/auth/LoginButton";
import { Spinner } from "@/components/Spinner";
import { Today } from "@/features/today/Today";
import { History } from "@/features/history/History";
import { NavTabs } from "@/components/NavTabs";
import "@/styles.css";

type SBSession = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SBSession | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"today" | "history">("today");

  useEffect(() => {
    // Semilla + suscripción a cambios de sesión
    let unsub = () => {};
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session ?? null);

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
          setSession(s);
        });
        unsub = () => sub.subscription.unsubscribe();
      } catch (e: any) {
        setErr(e?.message ?? "Error de inicio");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setTab("today");
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card glass" style={{ textAlign: "center" }}>
          <Spinner />
          <p className="muted">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container">
        {err && <Banner kind="error" msg={err} />}
        <div className="card glass" style={{ textAlign: "center" }}>
          <h2>
            Bienvenido a <span className="brand">GymApp</span>
          </h2>
          <p className="muted">Registra y compara tus sesiones sin fricción.</p>
          <LoginWithGoogle />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 120 }}>
      {err && <Banner kind="error" msg={err} />}
      <header
        className="card glass"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div className="row">
          <h2 style={{ margin: 0 }}>GymApp</h2>
          <span className="badge">{session.user.email}</span>
        </div>
        <button className="btn" onClick={signOut}>
          Salir
        </button>
      </header>

      {tab === "today" ? <Today /> : <History />}

      <NavTabs tab={tab} onTab={setTab} />
    </div>
  );
}

function Banner({ kind, msg }: { kind: "error" | "info"; msg: string }) {
  return <div className={`banner ${kind}`}>{msg}</div>;
}
