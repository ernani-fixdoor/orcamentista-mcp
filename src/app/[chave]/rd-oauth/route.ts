// Autorização OAuth da API v2 do RD Station (anexos).
// 1) Abra https://<projeto>/<MCP_CHAVE>/rd-oauth  → redireciona para o login/consentimento do RD.
// 2) O RD volta para esta mesma URL com ?code=... → trocamos pelos tokens e gravamos no Supabase.
// Esta URL (com a chave) é a "URL de callback" cadastrada no app do RD App Publisher.
import { autorizar, statusAutorizacao, urlAutorizacao } from "../../../lib/rdv2.ts";

export const dynamic = "force-dynamic";

const pagina = (titulo: string, texto: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title>` +
      `<body style="font-family:system-ui;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.5"><h1>${titulo}</h1><p>${texto}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );

export async function GET(req: Request, ctx: { params: Promise<{ chave: string }> }) {
  const { chave } = await ctx.params;
  const esperada = process.env.MCP_CHAVE;
  if (!esperada || esperada.length < 16 || chave !== esperada) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  const redirectUri = `https://${host}/${chave}/rd-oauth`;

  const erro = url.searchParams.get("error");
  if (erro) return pagina("Autorização não concluída", `O RD Station respondeu: ${erro.replace(/[<>&"]/g, "")}.`, 400);

  const code = url.searchParams.get("code");
  if (!code) {
    if (url.searchParams.get("status") !== null) return Response.json(await statusAutorizacao());
    return Response.redirect(urlAutorizacao(redirectUri), 302);
  }
  try {
    await autorizar(code, redirectUri);
    return pagina("RD Station autorizado ✅", "O Orçamentista já pode anexar arquivos aos cards. Pode fechar esta página.");
  } catch (e) {
    return pagina("Falha na autorização", String((e as Error).message).replace(/[<>&"]/g, ""), 500);
  }
}
