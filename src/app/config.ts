export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_ANON: import.meta.env.VITE_SUPABASE_ANON as string | undefined
};

export function envOk(): boolean {
  return Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON);
}

export function missingEnvMessage(): string {
  const miss: string[] = [];
  if (!ENV.SUPABASE_URL) miss.push("VITE_SUPABASE_URL");
  if (!ENV.SUPABASE_ANON) miss.push("VITE_SUPABASE_ANON");
  return `Faltan variables de entorno: ${miss.join(", ")}`;
}
