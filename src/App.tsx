import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import { initAuth } from "@/app/auth";
import { Today } from "@/features/today/Today";
import { LoginWithGoogle } from "@/features/auth/LoginButton";
import { Spinner } from "@/components/Spinner";
import "@/styles.css";

type SupaSession = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

export function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SupaSession | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await initAuth(); // <-- clave para no quedarse en blanco tras login
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(data.session ?? null);
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
        unsub = () => sub.subscription.unsubscribe();
      } catch (e: any) {
        setErr(e?.message ?? "Error de autenticación");
      } finally {
        setLoading(false);
      }
    })();
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <Frame>
        <Header />
        <Center>
          <Spinner />
          <p className="muted">Cargando sesión…</p>
        </Center>
      </Frame>
    );
  }

  return (
    <Frame>
      <Header />
      {err && <Banner kind="error" msg={err} />}
      {!session ? (
        <Center>
          <Card>
            <h2>Bienvenido a <span className="brand">GymApp</span></h2>
            <p className="muted">Registra tus series con máximo detalle y sin fricción.</p>
            <LoginWithGoogle />
          </Card>
        </Center>
      ) : (
        <Main>
          <Today />
        </Main>
      )}
    </Frame>
  );
}

function Frame({ children }: { children: any }) {
  return <div className="frame">{children}</div>;
}
function Header() {
  return (
    <header className="header glass">
      <div className="logo brand">GymApp</div>
      <div className="spacer" />
    </header>
  );
}
function Main({ children }: { children: any }) {
  return <main className="container">{children}</main>;
}
function Center({ children }: { children: any }) {
  return <div className="center">{children}</div>;
}
function Card({ children }: { children: any }) {
  return <div className="card glass">{children}</div>;
}
function Banner({ kind, msg }: { kind: "error" | "info"; msg: string }) {
  return <div className={`banner ${kind}`}>{msg}</div>;
}
