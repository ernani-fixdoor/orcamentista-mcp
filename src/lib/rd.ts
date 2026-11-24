// Cliente da API v1 do RD Station CRM (https://crm.rdstation.com/api/v1, autenticação por ?token=).
// Conferido com a conta da FixDoor. A API v1 NÃO expõe anexos/arquivos dos cards.
// CNPJ, ESTADO, IE e contribuinte ficam nos campos da EMPRESA (organization_custom_fields).

const BASE = "https://crm.rdstation.com/api/v1";

function token() {
  const t = process.env.RD_CRM_TOKEN;
  if (!t) throw new Error("Conector sem RD_CRM_TOKEN configurado na Vercel.");
  return t;
}

export async function rd<T = any>(
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  caminho: string,
  opcoes: { query?: Record<string, string | number | boolean | undefined>; corpo?: unknown } = {},
): Promise<T> {
  const limpo = caminho.replace(/^\/+/, "").replace(/^api\/v1\//, "");
  const url = new URL(`${BASE}/${limpo}`);
  url.searchParams.set("token", token());
  for (const [k, v] of Object.entries(opcoes.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  for (let tentativa = 1; ; tentativa++) {
    const res = await fetch(url, {
      method: metodo,
      cache: "no-store",
      headers: { Accept: "application/json", ...(opcoes.corpo ? { "Content-Type": "application/json" } : {}) },
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    });
    // limite de requisições do RD: espera um pouco e tenta de novo
    if (res.status === 429 && tentativa < 3) { await new Promise((r) => setTimeout(r, 2000 * tentativa)); continue; }
    const texto = await res.text();
    if (!res.ok) throw new Error(`RD Station ${metodo} /${limpo}: HTTP ${res.status} ${texto.slice(0, 400)}`);
    return (texto ? JSON.parse(texto) : null) as T;
  }
}

// Rótulos dos campos personalizados (os da empresa vêm só com o id) e nomes dos usuários. Cache de 10 min.
let cacheRotulos: { em: number; mapa: Record<string, string> } | null = null;
async function rotulos(): Promise<Record<string, string>> {
  if (cacheRotulos && Date.now() - cacheRotulos.em < 600_000) return cacheRotulos.mapa;
  const r: any = await rd("GET", "custom_fields");
  const lista = Array.isArray(r) ? r : r?.custom_fields ?? [];
  const mapa = Object.fromEntries(lista.map((c: any) => [String(c._id ?? c.id), String(c.label ?? "").trim()]));
  cacheRotulos = { em: Date.now(), mapa };
  return mapa;
}
let cacheUsuarios: { em: number; mapa: Record<string, string> } | null = null;
async function usuarios(): Promise<Record<string, string>> {
  if (cacheUsuarios && Date.now() - cacheUsuarios.em < 600_000) return cacheUsuarios.mapa;
  const r: any = await rd("GET", "users");
  const lista = Array.isArray(r) ? r : r?.users ?? [];
  const mapa = Object.fromEntries(lista.map((u: any) => [String(u._id ?? u.id), String(u.name ?? "")]));
  cacheUsuarios = { em: Date.now(), mapa };
  return mapa;
}

/** Campos personalizados como { "Rótulo": valor }. */
function camposPersonalizados(deal: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const c of deal?.deal_custom_fields ?? []) {
    const rotulo = c?.custom_field?.label ?? deal?._rotulos?.[c?.custom_field_id] ?? c?.custom_field_id ?? "campo";
    out[String(rotulo)] = c?.value ?? null;
  }
  return out;
}

export function resumirNegocio(d: any) {
  return {
    id: d?._id ?? d?.id,
    nome: d?.name,
    valor: d?.amount_total ?? d?.amount ?? null,
    etapa: d?.deal_stage ? { id: d.deal_stage._id ?? d.deal_stage.id, nome: d.deal_stage.name } : null,
    funil: d?.deal_stage?.deal_pipeline ? { id: d.deal_stage.deal_pipeline._id ?? d.deal_stage.deal_pipeline.id, nome: d.deal_stage.deal_pipeline.name } : null,
    responsavel: d?.user ? { id: d.user._id ?? d.user.id, nome: d.user.name, email: d.user.email } : null,
    empresa: d?.organization ? { id: d.organization._id ?? d.organization.id, nome: d.organization.name, campos: camposPersonalizados({ deal_custom_fields: d.organization.organization_custom_fields, _rotulos: d._rotulos }) } : null,
    contatos: (d?.contacts ?? []).map((c: any) => ({
      nome: c.name, cargo: c.title,
      emails: (c.emails ?? []).map((e: any) => e.email),
      telefones: (c.phones ?? []).map((p: any) => p.phone),
    })),
    produtos: (d?.deal_products ?? []).map((p: any) => ({ nome: p.name, quantidade: p.amount, preco: p.price, total: p.total, descricao: p.description })),
    campos_personalizados: camposPersonalizados(d),
    fonte: d?.deal_source?.name ?? null,
    criado_em: d?.created_at, atualizado_em: d?.updated_at,
    status: d?.win === true ? "ganho" : d?.win === false ? "perdido" : "aberto",
  };
}

export const buscarNegocios = (o: { nome?: string; etapa_id?: string; pagina?: number; limite?: number }) =>
  rd("GET", "deals", { query: { name: o.nome, deal_stage_id: o.etapa_id, page: o.pagina ?? 1, limit: Math.min(o.limite ?? 20, 200) } });

/** Lê o negócio já com os rótulos dos campos da empresa (CNPJ, ESTADO, IE, contribuinte...). */
export async function lerNegocio(id: string) {
  const d: any = await rd("GET", `deals/${encodeURIComponent(id)}`);
  try { d._rotulos = await rotulos(); } catch { /* sem rótulos: os campos da empresa aparecem pelo id */ }
  return d;
}

/** Anotações com o nome do autor. */
export async function listarAnotacoes(dealId: string) {
  const r: any = await rd("GET", "activities", { query: { deal_id: dealId, limit: 200 } });
  let nomes: Record<string, string> = {};
  try { nomes = await usuarios(); } catch { /* segue sem nomes */ }
  for (const a of r?.activities ?? []) if (!a.user && a.user_id) a.user = { name: nomes[a.user_id] ?? a.user_id };
  return r;
}

export const listarTarefas = (dealId: string) => rd("GET", "tasks", { query: { deal_id: dealId, limit: 200 } });

export const listarFunis = () => rd("GET", "deal_pipelines");

export const listarEtapas = (funilId?: string) => rd("GET", "deal_stages", { query: { deal_pipeline_id: funilId, limit: 200 } });

export const listarCamposPersonalizados = () => rd("GET", "custom_fields", { query: { option: "deal" } });

export const listarUsuarios = () => rd("GET", "users");

export function criarTarefa(t: { deal_id: string; assunto: string; descricao?: string; tipo?: string; data: string; hora: string; usuario_ids?: string[] }) {
  return rd("POST", "tasks", {
    corpo: {
      task: {
        deal_id: t.deal_id,
        subject: t.assunto,
        type: t.tipo ?? "task",
        date: t.data,
        hour: t.hora,
        ...(t.usuario_ids?.length ? { user_ids: t.usuario_ids } : {}),
        ...(t.descricao ? { notes: t.descricao } : {}),
      },
    },
  });
}

export const criarAnotacao = (dealId: string, texto: string) =>
  rd("POST", "activities", { corpo: { activity: { deal_id: dealId, text: texto } } });

export const moverNegocio = (dealId: string, etapaId: string) =>
  rd("PUT", `deals/${encodeURIComponent(dealId)}`, { corpo: { deal: { deal_stage_id: etapaId }, deal_stage_id: etapaId } });

export const atualizarCampos = (dealId: string, campos: { custom_field_id: string; valor: unknown }[]) =>
  rd("PUT", `deals/${encodeURIComponent(dealId)}`, {
    corpo: { deal: { deal_custom_fields: campos.map((c) => ({ custom_field_id: c.custom_field_id, value: c.valor })) } },
  });

// ---------- Produtos do card (definem o VALOR da negociação no RD) ----------
type ProdutoCatalogo = { id: string; nome: string };
let cacheCatalogo: { em: number; lista: ProdutoCatalogo[] } | null = null;
export async function catalogoProdutos(): Promise<ProdutoCatalogo[]> {
  if (cacheCatalogo && Date.now() - cacheCatalogo.em < 600_000) return cacheCatalogo.lista;
  const r: any = await rd("GET", "products", { query: { limit: 200 } });
  const lista: ProdutoCatalogo[] = (r?.products ?? []).map((p: any) => ({ id: String(p._id ?? p.id), nome: String(p.name ?? "").trim() }));
  cacheCatalogo = { em: Date.now(), lista };
  return lista;
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Acha o produto do catálogo pelo id ou pelo nome (sem acento/maiúsculas; aceita trecho único). */
export async function resolverProduto(ref: string) {
  const lista = await catalogoProdutos();
  const porId = lista.find((p) => p.id === ref);
  if (porId) return porId;
  const alvo = normalizar(ref);
  const exato = lista.filter((p) => normalizar(p.nome) === alvo);
  if (exato.length === 1) return exato[0];
  const parcial = lista.filter((p) => normalizar(p.nome).includes(alvo));
  if (parcial.length === 1) return parcial[0];
  throw new Error(`Produto do RD não identificado: "${ref}". Opções: ${lista.map((p) => p.nome).join(" · ")}`);
}

export const listarProdutosNegocio = async (dealId: string) => {
  const r: any = await rd("GET", `deals/${encodeURIComponent(dealId)}/deal_products`);
  return (r?.deal_products ?? []).map((p: any) => ({ id: String(p._id ?? p.id), produto_id: String(p.product_id), nome: String(p.name ?? "").trim(), quantidade: p.amount, preco: Number(p.price), total: Number(p.total) }));
};

/**
 * Define os produtos do card (cada categoria com quantidade 1 e preço = soma dos itens dela).
 * Atualiza a linha existente do mesmo produto ou cria; com removerOutros, apaga as linhas não informadas.
 * O RD recalcula o valor da negociação a partir dos produtos.
 */
export async function definirProdutosNegocio(dealId: string, itens: { produto: string; valor: number }[], removerOutros = false) {
  const id = encodeURIComponent(dealId);
  const antes = await listarProdutosNegocio(dealId);
  const alvo = new Map<string, { nome: string; valor: number }>();
  for (const i of itens) {
    if (!(Number(i.valor) >= 0)) throw new Error(`Valor inválido para "${i.produto}".`);
    const p = await resolverProduto(i.produto);
    const atual = alvo.get(p.id);
    alvo.set(p.id, { nome: p.nome, valor: Math.round(((atual?.valor ?? 0) + Number(i.valor)) * 100) / 100 });
  }
  const feitos: string[] = [];
  for (const [produtoId, { nome, valor }] of alvo) {
    const corpo = { product_id: produtoId, price: valor, amount: 1, discount: 0, discount_type: "value", recurrence: "spare" };
    const linhas = antes.filter((l: any) => l.produto_id === produtoId);
    if (linhas.length) {
      await rd("PUT", `deals/${id}/deal_products/${encodeURIComponent(linhas[0].id)}`, { corpo });
      feitos.push(`atualizado: ${nome} = ${valor}`);
      for (const extra of linhas.slice(1)) { await rd("DELETE", `deals/${id}/deal_products/${encodeURIComponent(extra.id)}`); feitos.push(`removida linha duplicada: ${nome}`); }
    } else {
      await rd("POST", `deals/${id}/deal_products`, { corpo });
      feitos.push(`criado: ${nome} = ${valor}`);
    }
  }
  if (removerOutros) {
    for (const l of antes.filter((l: any) => !alvo.has(l.produto_id))) {
      await rd("DELETE", `deals/${id}/deal_products/${encodeURIComponent(l.id)}`);
      feitos.push(`removido: ${l.nome} (${l.total})`);
    }
  }
  const depois = await listarProdutosNegocio(dealId);
  const negocio: any = await rd("GET", `deals/${id}`);
  return { feitos, antes, depois, valor_do_card: negocio?.amount_total ?? null };
}

export const renomearNegocio = (dealId: string, nome: string) =>
  rd("PUT", `deals/${encodeURIComponent(dealId)}`, { corpo: { deal: { name: nome } } });

/** Troca o responsável (dono) do card. `userId` vem de GET users (rd_consulta_api caminho "users"). */
export const alterarResponsavel = (dealId: string, userId: string) =>
  rd("PUT", `deals/${encodeURIComponent(dealId)}`, { corpo: { deal: { user_id: userId } } });

/** Emoji de cada empresa no título do card: pedido FixDoor 🟧, OS MaxDock 🟦, pedido Fast & Safe 🟩. */
export const EMOJI_EMPRESA = { fixdoor: "🟧", maxdock: "🟦", fast: "🟩" } as const;
export type EmpresaTitulo = keyof typeof EMOJI_EMPRESA;

/**
 * Acrescenta " | N° <numero> <emoji>" ao título, no padrão da equipe ("CLIENTE | N° 5695 🟧 | N° 1923 🟦").
 * Se o número já estiver no título, não repete. Remove espaços sobrando no fim.
 */
export function tituloComNumero(atual: string, empresa: EmpresaTitulo, numero: string | number): string {
  const n = String(numero).trim();
  if (!/^\d+$/.test(n)) throw new Error(`Número inválido: "${numero}"`);
  const semZeros = n.replace(/^0+(?=\d)/, "");
  const base = String(atual ?? "").replace(/\s+$/, "");
  if (new RegExp(`N[°º]\\s*0*${semZeros}(?!\\d)`).test(base)) return base;
  return `${base} | N° ${n} ${EMOJI_EMPRESA[empresa]}`;
}

/** Próximo dia útil (seg–sex) a partir de hoje, no fuso de São Paulo, no formato AAAA-MM-DD. */
export function proximoDiaUtil(base = new Date()): string {
  const sp = new Date(base.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  do sp.setDate(sp.getDate() + 1); while (sp.getDay() === 0 || sp.getDay() === 6);
  return `${sp.getFullYear()}-${String(sp.getMonth() + 1).padStart(2, "0")}-${String(sp.getDate()).padStart(2, "0")}`;
}

// ---------- Criar card ----------
export type NovoNegocio = {
  nome: string;
  etapa_id: string;
  responsavel_id?: string;
  empresa_id?: string;
  contato_ids?: string[];
  campos?: { custom_field_id: string; valor: unknown }[];
};

/** Corpo do POST /deals da API v1 do RD. Só inclui o que foi informado. */
export function corpoNovoNegocio(n: NovoNegocio) {
  const nome = String(n.nome ?? "").trim();
  if (nome.length < 3) throw new Error("Informe o nome (título) do card, com pelo menos 3 caracteres.");
  if (!n.etapa_id) throw new Error("Informe etapa_id (use rd_listar_funis).");
  return {
    deal: {
      name: nome,
      deal_stage_id: n.etapa_id,
      ...(n.responsavel_id ? { user_id: n.responsavel_id } : {}),
      ...(n.empresa_id ? { organization_id: n.empresa_id } : {}),
      ...(n.contato_ids?.length ? { contacts_ids: n.contato_ids } : {}),
      ...(n.campos?.length ? { deal_custom_fields: n.campos.map((c) => ({ custom_field_id: c.custom_field_id, value: c.valor })) } : {}),
    },
  };
}

/**
 * Cria o card. Confere no retorno se a empresa e os contatos foram ligados; se não, tenta ligar com um PUT
 * e informa em `avisos` o que não ficou como pedido (nada é adivinhado em silêncio).
 */
export async function criarNegocio(n: NovoNegocio) {
  let d: any = await rd("POST", "deals", { corpo: corpoNovoNegocio(n) });
  const id = String(d?._id ?? d?.id ?? "");
  if (!id) throw new Error("O RD não devolveu o id do card criado. Confira no RD se ele foi criado antes de repetir.");
  const avisos: string[] = [];
  const faltaEmpresa = n.empresa_id && String(d?.organization?._id ?? d?.organization?.id ?? "") !== n.empresa_id;
  const idsContatos = (d?.contacts ?? []).map((c: any) => String(c._id ?? c.id));
  const faltaContato = (n.contato_ids ?? []).filter((c) => !idsContatos.includes(c));
  if (faltaEmpresa || faltaContato.length) {
    try {
      d = await rd("PUT", `deals/${encodeURIComponent(id)}`, {
        corpo: { deal: { ...(faltaEmpresa ? { organization_id: n.empresa_id } : {}), ...(faltaContato.length ? { contacts_ids: n.contato_ids } : {}) } },
      });
    } catch (e) { avisos.push(`Card criado, mas não consegui ligar a empresa/contatos: ${(e as Error).message}`); }
    const conferido: any = await rd("GET", `deals/${encodeURIComponent(id)}`);
    if (n.empresa_id && String(conferido?.organization?._id ?? conferido?.organization?.id ?? "") !== n.empresa_id) avisos.push("A empresa NÃO ficou ligada ao card: ligue no RD.");
    const ids2 = (conferido?.contacts ?? []).map((c: any) => String(c._id ?? c.id));
    const sem = (n.contato_ids ?? []).filter((c) => !ids2.includes(c));
    if (sem.length) avisos.push(`Contatos NÃO ligados ao card: ${sem.join(", ")}. Ligue no RD.`);
    d = conferido;
  }
  return { ...resumirNegocio(d), avisos };
}
