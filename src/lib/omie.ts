// Anexos no Omie (API geral/anexo). O conector Omie oficial do Claude não envia arquivo local,
// e o IncluirAnexo exige ZIP em base64 (centenas de milhares de caracteres para um PDF), então
// o conector baixa o arquivo por URL, compacta e envia sozinho.
//
// Credenciais (Vercel): OMIE_FIXDOOR_APP_KEY, OMIE_FIXDOOR_APP_SECRET, OMIE_MAXDOCK_APP_KEY, OMIE_MAXDOCK_APP_SECRET.
// Nunca use a Fast & Safe neste processo.
import { createHash } from "node:crypto";
import { zipUmArquivo } from "./zip.ts";

const URL_ANEXO = "https://app.omie.com.br/api/v1/geral/anexo/";
const LIMITE_BYTES = 8 * 1024 * 1024;

export type EmpresaOmie = "fixdoor" | "maxdock";
export type TabelaAnexo = "pedido-venda" | "ordem-servico";

/** Só URLs https públicas (bloqueia localhost, redes privadas e metadados de nuvem). */
export function urlPublica(texto: string): URL {
  const u = new URL(texto);
  const h = u.hostname.toLowerCase();
  const privado =
    h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local") ||
    h === "0.0.0.0" || h === "[::1]" || h.startsWith("[") ||
    /^(127|10)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  if (u.protocol !== "https:" || privado) throw new Error("Só URLs https públicas.");
  return u;
}

/** Nome aceito pelo Omie (até 100 caracteres, sem caracteres de caminho), preservando a extensão. */
export function nomeSeguro(nome: string, padrao = "arquivo.pdf"): string {
  const limpo = nome.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim() || padrao;
  if (limpo.length <= 100) return limpo;
  const ponto = limpo.lastIndexOf(".");
  const ext = ponto > 0 && limpo.length - ponto <= 10 ? limpo.slice(ponto) : "";
  return limpo.slice(0, 100 - ext.length).trim() + ext;
}

export function extensao(nome: string, tipoMime?: string): string {
  const ponto = nome.lastIndexOf(".");
  if (ponto > 0 && nome.length - ponto <= 11) return nome.slice(ponto + 1).toLowerCase();
  if (tipoMime?.includes("pdf")) return "pdf";
  if (tipoMime?.includes("png")) return "png";
  if (tipoMime?.includes("jpeg")) return "jpg";
  return "bin";
}

function credenciais(empresa: EmpresaOmie) {
  const E = empresa.toUpperCase();
  const app_key = process.env[`OMIE_${E}_APP_KEY`];
  const app_secret = process.env[`OMIE_${E}_APP_SECRET`];
  if (!app_key || !app_secret) {
    throw new Error(`Credenciais do Omie ${empresa} não configuradas: defina OMIE_${E}_APP_KEY e OMIE_${E}_APP_SECRET na Vercel.`);
  }
  return { app_key, app_secret };
}

async function chamar(empresa: EmpresaOmie, call: string, param: Record<string, unknown>) {
  const r = await fetch(URL_ANEXO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ call, ...credenciais(empresa), param: [param] }),
    cache: "no-store",
  });
  const texto = await r.text();
  let j: any;
  try { j = JSON.parse(texto); } catch { throw new Error(`Omie respondeu HTTP ${r.status}: ${texto.slice(0, 300)}`); }
  if (j?.faultstring) throw new Error(`Omie: ${j.faultstring}`);
  if (j?.cCodStatus !== undefined && String(j.cCodStatus) !== "0") throw new Error(`Omie: ${j.cDesStatus ?? JSON.stringify(j)}`);
  return j;
}

export async function anexarNoOmie(o: {
  empresa: EmpresaOmie;
  tabela: TabelaAnexo;
  id: number;
  url: string;
  nome_arquivo?: string;
}) {
  const u = urlPublica(o.url);
  credenciais(o.empresa); // falha cedo, antes de baixar
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) throw new Error(`Não consegui baixar o arquivo: HTTP ${r.status}`);
  if (r.url) urlPublica(r.url); // um redirecionamento também precisa ser público
  const tipoMime = (r.headers.get("content-type") ?? "").split(";")[0];
  const bruto = Buffer.from(await r.arrayBuffer());
  if (bruto.length === 0) throw new Error("O arquivo veio vazio.");
  if (bruto.length > LIMITE_BYTES) throw new Error(`Arquivo grande demais (${Math.round(bruto.length / 1024 / 1024)} MB; limite 8 MB).`);

  const nome = nomeSeguro(o.nome_arquivo?.trim() || decodeURIComponent(u.pathname.split("/").pop() || ""));
  const zip = zipUmArquivo(nome, bruto);
  const cArquivo = zip.toString("base64");
  const base = {
    cTabela: o.tabela,
    nId: o.id,
    cNomeArquivo: nome,
    cTipoArquivo: extensao(nome, tipoMime).slice(0, 10),
    cArquivo,
  };

  // A documentação do Omie diz "MD5 do arquivo enviado em cArquivo", sem dizer de quê. Conferido no Omie real (03/11/2026):
  // vale o MD5 do TEXTO base64 de cArquivo; o do ZIP é recusado ("MD5 ... é inválido. Esperado o MD5 ..."). Por isso o base64 vai
  // primeiro. Se um dia o Omie mudar e reclamar do MD5, repete com o MD5 do ZIP.
  const md5B64 = createHash("md5").update(cArquivo).digest("hex");
  const md5Zip = createHash("md5").update(zip).digest("hex");
  let resposta: any;
  let md5Usado = "base64";
  try {
    resposta = await chamar(o.empresa, "IncluirAnexo", { ...base, cMd5: md5B64 });
  } catch (e) {
    if (!/md5/i.test((e as Error).message)) throw e;
    md5Usado = "zip";
    resposta = await chamar(o.empresa, "IncluirAnexo", { ...base, cMd5: md5Zip });
  }

  // Conferência: o anexo aparece na lista do documento?
  let conferido: unknown = false;
  try {
    const lista = await chamar(o.empresa, "ListarAnexo", { nPagina: 1, nRegPorPagina: 100, cTabela: o.tabela, nId: o.id });
    const achou = JSON.stringify(lista).includes(nome);
    conferido = achou ? true : "não apareceu na listagem; confira no Omie";
  } catch (e) {
    conferido = `não consegui listar: ${(e as Error).message}`;
  }

  return {
    anexado: true,
    empresa: o.empresa,
    tabela: o.tabela,
    id: o.id,
    nome_arquivo: nome,
    tamanho_original_kb: Math.round(bruto.length / 1024),
    tamanho_zip_kb: Math.round(zip.length / 1024),
    md5_usado: md5Usado,
    conferido,
    resposta_omie: resposta,
  };
}
