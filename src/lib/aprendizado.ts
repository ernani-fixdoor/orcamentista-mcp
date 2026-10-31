// Histórico de orçamentos e aprendizados: Supabase, schema "orcamentista" (separado do resto),
// acessado pelas funções public.orc_* (ver supabase.ts).
import { rpc } from "./supabase.ts";

export const listarAprendizados = (o: { categoria?: string; incluir_propostos?: boolean }) =>
  rpc<any[]>("orc_aprendizados", { p_categoria: o.categoria || null, p_incluir_propostos: !!o.incluir_propostos });

export const proporAprendizado = (a: { categoria: string; regra: string; exemplo?: string; orcamento_id?: number; criado_por?: string }) =>
  rpc("orc_aprendizado_propor", { p_dados: a });

export const definirStatusAprendizado = (id: number, status: "confirmado" | "descartado" | "proposto", quem?: string, regra?: string) =>
  rpc("orc_aprendizado_status", { p_id: id, p_status: status, p_quem: quem ?? null, p_regra: regra ?? null });

/** Cria (sem id) ou atualiza (com id) o registro do orçamento. Só os campos enviados mudam. */
export const registrarOrcamento = (d: Record<string, unknown> & { id?: number }) =>
  rpc("orc_orcamento_salvar", { p_dados: Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)) });

export const historicoDoNegocio = (rdDealId: string) => rpc<any[]>("orc_orcamento_historico", { p_rd_deal_id: rdDealId });
