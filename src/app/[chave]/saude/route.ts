// Diagnóstico do conector: GET https://<projeto>.vercel.app/<MCP_CHAVE>/saude
// Confere Supabase (funções orc_*), RD Station (token) e consulta de CNPJ, sem expor segredos.
import { rpc } from "../../../lib/supabase.ts";
import { rd } from "../../../lib/rd.ts";
import { consultarCnpj } from "../../../lib/cnpj.ts";
import { accessToken, statusAutorizacao } from "../../../lib/rdv2.ts";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function teste(fn: () => Promise<unknown>) {
  try { return { ok: true, resultado: await fn() }; } catch (e) { return { ok: false, erro: (e as Error).message }; }
}

export async function GET(_req: Request, ctx: { params: Promise<{ chave: string }> }) {
  const { chave } = await ctx.params;
  const esperada = process.env.MCP_CHAVE;
  if (!esperada || esperada.length < 16 || chave !== esperada) return new Response("Not found", { status: 404 });
  const [supabase, aprendizados, rdStation, cnpj, rdV2] = await Promise.all([
    teste(async () => ({ cmv_cliente_final: await rpc("orc_cmv") })),
    teste(async () => ({ confirmados: ((await rpc<any[]>("orc_aprendizados")) ?? []).length })),
    teste(async () => {
      if (!process.env.RD_CRM_TOKEN) throw new Error("RD_CRM_TOKEN não configurado");
      const r: any = await rd("GET", "deal_pipelines");
      const lista = Array.isArray(r) ? r : r?.deal_pipelines ?? [];
      return { funis: lista.map((f: any) => f.name) };
    }),
    teste(async () => (await consultarCnpj("00000000000191")).razao_social),
    teste(async () => {
      const st = await statusAutorizacao();
      if (!st.autorizado) return st;
      await accessToken();
      return { ...(await statusAutorizacao()), token_ok: true };
    }),
  ]);
  return Response.json({ supabase, aprendizados, rdStation, cnpj, rdV2 }, { headers: { "Cache-Control": "no-store" } });
}
