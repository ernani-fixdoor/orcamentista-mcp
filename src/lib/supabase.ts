// Acesso ao Supabase "fixdoor-sistemas" por funções protegidas (public.orc_*), só no servidor.
// As funções são SECURITY DEFINER e só respondem com a chave do Orçamentista (ORC_DB_CHAVE), cujo
// hash fica em orcamentista.config. Assim o conector não precisa da service key e o schema
// "orcamentista" não precisa ser exposto na API.

const numOuNull = (v: unknown) => (v == null || v === "" ? null : Number(v));
export { numOuNull };

export async function rpc<T = any>(funcao: string, args: Record<string, unknown> = {}): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const chave = process.env.ORC_DB_CHAVE;
  if (!url || !key || !chave) throw new Error("Conector sem SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / ORC_DB_CHAVE configurados na Vercel.");
  const res = await fetch(`${url}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: key,
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_chave: chave, ...args }),
  });
  const texto = await res.text();
  if (!res.ok) {
    if (texto.includes("acesso negado")) throw new Error("Supabase recusou a chave do Orçamentista (ORC_DB_CHAVE não confere com orcamentista.config).");
    throw new Error(`Supabase ${funcao}: HTTP ${res.status} ${texto.slice(0, 500)}`);
  }
  return (texto ? JSON.parse(texto) : null) as T;
}
