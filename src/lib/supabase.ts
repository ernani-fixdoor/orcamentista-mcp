// Acesso ao Supabase "fixdoor-sistemas" pela API REST (PostgREST), só no servidor.
// Tabelas de preço: schema public (precos_*). Orçamentista: schema "orcamentista" (precisa estar
// em Settings > API > Exposed schemas).

const numOuNull = (v: unknown) => (v == null || v === "" ? null : Number(v));
export { numOuNull };

export async function sb<T = any>(
  path: string,
  init: RequestInit & { schema?: string } = {},
): Promise<T> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Conector sem SUPABASE_URL / SUPABASE_SERVICE_KEY configurados na Vercel.");
  const { schema = "public", headers, ...resto } = init;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...resto,
    cache: "no-store",
    headers: {
      apikey: key,
      // chave antiga (JWT "eyJ...") vai também no Authorization; a nova (sb_secret_...) só no apikey
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      "Accept-Profile": schema,
      "Content-Profile": schema,
      ...headers,
    },
  });
  const texto = await res.text();
  if (!res.ok) {
    if (texto.includes("PGRST106") || texto.includes("Invalid schema")) {
      throw new Error(`Supabase: o schema "${schema}" não está exposto na API. Em Supabase > Project Settings > Data API > Exposed schemas, adicione "${schema}".`);
    }
    throw new Error(`Supabase ${res.status}: ${texto.slice(0, 500)}`);
  }
  return (texto ? JSON.parse(texto) : null) as T;
}
