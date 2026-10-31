// Tabela TIPI (IPI por NCM), guardada no Supabase (orcamentista.tipi) e consultada pela função orc_tipi_consultar.
import { rpc } from "./supabase.ts";

export const ncmLimpo = (ncm: string) => String(ncm ?? "").replace(/\D/g, "").slice(0, 8);

export async function consultarTipi(ncms: string[]) {
  const lista = [...new Set(ncms.map(ncmLimpo).filter((n) => n.length === 8))];
  if (!lista.length) throw new Error("Informe ao menos um NCM com 8 dígitos.");
  const r: any = await rpc("orc_tipi_consultar", { p_ncms: lista });
  if (!r?.total_tabela) throw new Error("A tabela TIPI ainda não foi carregada no Supabase (orcamentista.tipi).");
  return r;
}
