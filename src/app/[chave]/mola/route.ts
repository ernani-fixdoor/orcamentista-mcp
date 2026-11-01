// Diagnóstico da calculadora de molas: GET /<MCP_CHAVE>/mola?largura=3200&altura=4500&peso=230&painel=40
import { calcularMolaDoco } from "../../../lib/mola.ts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request, ctx: { params: Promise<{ chave: string }> }) {
  const { chave } = await ctx.params;
  const esperada = process.env.MCP_CHAVE;
  if (!esperada || esperada.length < 16 || chave !== esperada) return new Response("Not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  const n = (k: string, d?: number) => (q.get(k) ? Number(q.get(k)) : d);
  const inicio = Date.now();
  try {
    const r = await calcularMolaDoco({
      largura_mm: n("largura", 3200)!, altura_mm: n("altura", 4500)!, peso_porta_kg: n("peso", 230)!, peso_painel_inferior_kg: n("painel", 40)!,
      numero_molas: n("molas"), ciclos: n("ciclos"), tipo_porta: q.get("tipo") ?? undefined, acabamento: q.get("acabamento") ?? undefined,
    });
    return Response.json({ ok: true, segundos: (Date.now() - inicio) / 1000, ...r }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ ok: false, segundos: (Date.now() - inicio) / 1000, erro: (e as Error).message }, { status: 500 });
  }
}
