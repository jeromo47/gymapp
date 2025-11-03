export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_ANON: import.meta.env.VITE_SUPABASE_ANON as string | undefined
};

export function envOk(): boolean {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON);
}

export function missingEnvMessage(): string {
  const m: string[] = [];
  if (!ENV.SUPABASE_URL) m.push("VITE_SUPABASE_URL");
  if (!ENV.SUPABASE_ANON) m.push("VITE_SUPABASE_ANON");
  return "Faltan variables: " + m.join(", ");
}
