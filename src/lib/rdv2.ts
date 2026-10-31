// API v2 do RD Station CRM (https://api.rd.services/crm/v2), usada para ANEXOS dos cards.
// Autenticação OAuth 2.0 (app "Orçamentista" no RD App Publisher):
//  - access_token vale 2 h; refresh_token vale 14 dias sem uso e é renovado a cada uso (rolling).
//  - Tokens ficam em orcamentista.config (chaves rd_oauth_*), lidos/gravados pelas funções orc_config_*.
//  - Autorização inicial: abrir https://<projeto>/<MCP_CHAVE>/rd-oauth no navegador.
import { rpc } from "./supabase.ts";

const API = "https://api.rd.services";

function credenciais() {
  const id = process.env.RD_CLIENT_ID, secret = process.env.RD_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Conector sem RD_CLIENT_ID / RD_CLIENT_SECRET na Vercel.");
  return { id, secret };
}

interface Tokens { access_token: string; refresh_token: string; expires_in?: number }

async function gravarTokens(t: Tokens) {
  const expira = Date.now() + (Number(t.expires_in) || 7200) * 1000;
  await rpc("orc_config_gravar", {
    p_valores: { rd_oauth_access: t.access_token, rd_oauth_refresh: t.refresh_token, rd_oauth_expira: String(expira), rd_oauth_renovado_em: new Date().toISOString() },
  });
}

async function pedirToken(campos: Record<string, string>): Promise<Tokens> {
  const { id, secret } = credenciais();
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, ...campos }),
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`RD OAuth: HTTP ${res.status} ${texto.slice(0, 300)}`);
  const t = JSON.parse(texto);
  if (!t.access_token || !t.refresh_token) throw new Error("RD OAuth: resposta sem tokens.");
  return t;
}

/** Troca o código de autorização (callback) pelos tokens e grava. */
export async function autorizar(code: string, redirectUri: string) {
  await gravarTokens(await pedirToken({ code, redirect_uri: redirectUri, grant_type: "authorization_code" }));
}

export function urlAutorizacao(redirectUri: string) {
  const { id } = credenciais();
  return `https://accounts.rdstation.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

let renovando: Promise<string> | null = null;

/** access_token válido, renovando quando faltar menos de 5 min. */
export async function accessToken(): Promise<string> {
  const c = await rpc<Record<string, string>>("orc_config_ler", { p_prefixo: "rd_oauth_" });
  if (!c?.rd_oauth_refresh) throw new Error("RD v2 ainda não autorizado: abra https://orcamentista-fixdoor.vercel.app/<MCP_CHAVE>/rd-oauth e autorize a conta.");
  if (c.rd_oauth_access && Number(c.rd_oauth_expira) - Date.now() > 5 * 60_000) return c.rd_oauth_access;
  // uma renovação por vez nesta instância (o refresh_token antigo deixa de valer após o uso)
  renovando ??= (async () => {
    try {
      const t = await pedirToken({ refresh_token: c.rd_oauth_refresh, grant_type: "refresh_token" });
      await gravarTokens(t);
      return t.access_token;
    } finally { renovando = null; }
  })();
  return renovando;
}

export async function statusAutorizacao() {
  const c = await rpc<Record<string, string>>("orc_config_ler", { p_prefixo: "rd_oauth_" });
  return {
    autorizado: !!c?.rd_oauth_refresh,
    access_expira_em: c?.rd_oauth_expira ? new Date(Number(c.rd_oauth_expira)).toISOString() : null,
    ultima_renovacao: c?.rd_oauth_renovado_em ?? null,
  };
}

async function v2<T = any>(metodo: string, caminho: string, corpo?: BodyInit, json = false): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}/crm/v2/${caminho.replace(/^\/+/, "")}`, {
    method: metodo,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(json ? { "Content-Type": "application/json" } : {}) },
    body: corpo,
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`RD v2 ${metodo} /${caminho}: HTTP ${res.status} ${texto.slice(0, 400)}`);
  return (texto ? JSON.parse(texto) : null) as T;
}

export const listarArquivos = (dealId: string) => v2("GET", `deals/${encodeURIComponent(dealId)}/files`);

/** Baixa o arquivo de uma URL https (ex.: PDF da proposta gerado pelo Omie) e anexa ao card. */
export async function anexarDeUrl(dealId: string, url: string, nomeArquivo?: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) throw new Error("Só URLs https públicas.");
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`Não consegui baixar o arquivo: HTTP ${r.status}`);
  const tipo = (r.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
  const buf = await r.arrayBuffer();
  if (buf.byteLength > 20 * 1024 * 1024) throw new Error(`Arquivo grande demais (${Math.round(buf.byteLength / 1024 / 1024)} MB).`);
  const nome = nomeArquivo?.trim() || decodeURIComponent(u.pathname.split("/").pop() || "arquivo.pdf");
  const form = new FormData();
  form.append("data[file]", new Blob([buf], { type: tipo }), nome);
  return v2("POST", `deals/${encodeURIComponent(dealId)}/files`, form);
}

export const excluirArquivo = (dealId: string, arquivoId: string) =>
  v2("DELETE", `deals/${encodeURIComponent(dealId)}/files/${encodeURIComponent(arquivoId)}`);

export const listarAnotacoesV2 = (dealId: string) => v2("GET", `deals/${encodeURIComponent(dealId)}/notes`);

/** Edição de anotação: NÃO documentada na API v2 (PUT existe no roteador, mas sem garantia). Experimental. */
export const editarAnotacao = (dealId: string, anotacaoId: string, texto: string) =>
  v2("PUT", `deals/${encodeURIComponent(dealId)}/notes/${encodeURIComponent(anotacaoId)}`, JSON.stringify({ data: { description: texto } }), true);
