// Histórico de orçamentos e aprendizados: Supabase, schema "orcamentista" (separado do resto).
import { sb } from "./supabase.ts";

const S = { schema: "orcamentista" };

export async function listarAprendizados(o: { categoria?: string; incluir_propostos?: boolean }) {
  const f = [o.incluir_propostos ? "status=in.(confirmado,proposto)" : "status=eq.confirmado"];
  if (o.categoria) f.push(`categoria=eq.${encodeURIComponent(o.categoria)}`);
  return sb<any[]>(`aprendizados?select=id,categoria,regra,exemplo,status,criado_em&${f.join("&")}&order=categoria.asc,id.asc&limit=300`, S);
}

export async function proporAprendizado(a: { categoria: string; regra: string; exemplo?: string; orcamento_id?: number; criado_por?: string }) {
  const r = await sb<any[]>("aprendizados", { ...S, method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...a, status: "proposto" }) });
  return r[0];
}

export async function definirStatusAprendizado(id: number, status: "confirmado" | "descartado" | "proposto", quem?: string, regra?: string) {
  const r = await sb<any[]>(`aprendizados?id=eq.${Number(id)}`, {
    ...S, method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status, ...(quem ? { confirmado_por: quem } : {}), ...(regra ? { regra } : {}) }),
  });
  if (!r.length) throw new Error(`Aprendizado ${id} não encontrado.`);
  return r[0];
}

const CAMPOS_ORC = [
  "usuario", "rd_deal_id", "rd_deal_nome", "cliente", "cnpj", "uf", "contribuinte", "simples_nacional", "destinacao",
  "empresa", "tipo", "omie_fixdoor", "omie_maxdock", "mao_de_obra", "frete", "locacao", "itens", "pendencias",
  "correcoes", "status", "resumo",
] as const;

function filtrar(d: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(d).filter(([k, v]) => (CAMPOS_ORC as readonly string[]).includes(k) && v !== undefined));
}

/** Cria (sem id) ou atualiza (com id) o registro do orçamento. */
export async function registrarOrcamento(d: Record<string, unknown> & { id?: number }) {
  const corpo = JSON.stringify(filtrar(d));
  if (d.id) {
    const r = await sb<any[]>(`orcamentos?id=eq.${Number(d.id)}`, { ...S, method: "PATCH", headers: { Prefer: "return=representation" }, body: corpo });
    if (!r.length) throw new Error(`Orçamento ${d.id} não encontrado.`);
    return r[0];
  }
  if (!d.rd_deal_id) throw new Error("rd_deal_id é obrigatório para criar o registro.");
  const r = await sb<any[]>("orcamentos", { ...S, method: "POST", headers: { Prefer: "return=representation" }, body: corpo });
  return r[0];
}

export async function historicoDoNegocio(rdDealId: string) {
  return sb<any[]>(`orcamentos?rd_deal_id=eq.${encodeURIComponent(rdDealId)}&order=criado_em.desc&limit=10`, S);
}
