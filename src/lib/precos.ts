// Tabela de preços FixDoor (Supabase, public.precos_*) + cálculo de ICMS. Por enquanto só CLIENTE FINAL.
import { calcular, comIcms, descreverCenario, origemImportada, ORIGENS, precoLiquido, type Cenario } from "./icms.ts";
import { numOuNull, rpc } from "./supabase.ts";

export interface ItemTabela {
  id: number;
  codigo: string | null;
  codigo_produto_omie: number | null;
  descricao: string;
  unidade: string | null;
  linha: string;
  grupo: string;
  custo: number | null;
  peso: number | null;
  origem: string | null;
  observacao: string | null;
  revisar: boolean;
  notas_revisao: string | null;
}

function normalizar(r: any): ItemTabela {
  return { ...r, custo: numOuNull(r.custo), peso: numOuNull(r.peso), codigo_produto_omie: numOuNull(r.codigo_produto_omie), origem: r.origem === "" ? null : r.origem };
}

/** CMV do cliente final (precos_parametros.chave = "cmv"). */
export async function cmvFinal(): Promise<number> {
  const v = Number(await rpc("orc_cmv"));
  if (!(v > 0)) throw new Error("CMV do cliente final não encontrado em precos_parametros (chave 'cmv').");
  return v;
}

/** Alertas que a skill deve mostrar e confirmar com a pessoa antes de usar o item. */
export function alertasDoItem(p: ItemTabela): string[] {
  const a: string[] = [];
  if (p.codigo_produto_omie == null) a.push("SEM código do produto no Omie: não dá para lançar no orçamento sem identificar/cadastrar o produto.");
  if (p.revisar) a.push(`Item marcado para REVISAR na tabela${p.notas_revisao ? `: ${p.notas_revisao}` : ""}. Confirme o preço.`);
  if (p.custo == null || p.peso == null) a.push("Sem custo ou peso: preço não calculável pela tabela. Peça o valor.");
  if (p.origem == null) a.push("Origem da mercadoria desconhecida (nacional x importado). Confira no cadastro do produto no Omie; o ICMS pode ser 4% se importado.");
  return a;
}

export async function buscarItens(o: { texto?: string; codigo?: string; ids?: number[]; grupo?: string; limite?: number }) {
  const rows = await rpc<any[]>("orc_itens", {
    p_texto: o.texto || null, p_codigo: o.codigo || null, p_grupo: o.grupo || null,
    p_ids: o.ids?.length ? o.ids.map(Number) : null, p_limite: o.limite ?? 20,
  });
  const cmv = await cmvFinal();
  return {
    cmv_cliente_final: cmv,
    itens: rows.map(normalizar).map((p) => ({
      ...p,
      origem_descricao: p.origem != null ? ORIGENS[p.origem] ?? p.origem : null,
      importado: p.origem == null ? null : origemImportada(p.origem),
      preco_liquido_sem_icms: precoLiquido(p.custo, p.peso, cmv),
      alertas: alertasDoItem(p),
    })),
  };
}

export interface PedidoItem { id?: number; codigo?: string; quantidade: number; importado?: boolean }

export async function calcularPrecos(cenario: Cenario, itens: PedidoItem[]) {
  const cmv = await cmvFinal();
  const ids = itens.filter((i) => i.id != null).map((i) => Number(i.id));
  const porId = new Map<number, ItemTabela>();
  if (ids.length) {
    const rows = await rpc<any[]>("orc_itens", { p_ids: ids, p_limite: 200 });
    for (const r of rows) porId.set(Number(r.id), normalizar(r));
  }
  const linhas = [];
  for (const i of itens) {
    let p: ItemTabela | undefined = i.id != null ? porId.get(Number(i.id)) : undefined;
    if (!p && i.codigo) {
      const r = await rpc<any[]>("orc_itens", { p_codigo: i.codigo, p_limite: 2 });
      if (r.length > 1) {
        linhas.push({ pedido: i, erro: `Código ${i.codigo} tem mais de uma linha na tabela (ex.: nacional x importado). Informe o id.` });
        continue;
      }
      p = r[0] ? normalizar(r[0]) : undefined;
    }
    if (!p) { linhas.push({ pedido: i, erro: "Item não encontrado na tabela de preços." }); continue; }
    const importado = i.importado ?? (p.origem == null ? false : origemImportada(p.origem));
    const calc = calcular(cenario, importado);
    const liquido = precoLiquido(p.custo, p.peso, cmv);
    const unit = comIcms(liquido, calc.aliqFixDoor);
    const alertas = alertasDoItem(p);
    if (i.importado == null && p.origem == null) {
      const alt = comIcms(liquido, calcular(cenario, true).aliqFixDoor);
      alertas.push(`Calculado como NACIONAL. Se for importado, o unitário seria ${alt}.`);
    }
    linhas.push({
      id: p.id, codigo: p.codigo, codigo_produto_omie: p.codigo_produto_omie, descricao: p.descricao, unidade: p.unidade,
      quantidade: i.quantidade, origem: p.origem, importado,
      preco_liquido_sem_icms: liquido, aliquota_icms_embutida: calc.aliqFixDoor, aliquota_icms_nf: calc.aliqNF,
      difal: calc.difal, difal_por: calc.difalPor,
      valor_unitario: unit, valor_total: unit == null ? null : Math.round(unit * i.quantidade * 100) / 100,
      alertas,
    });
  }
  const total = linhas.reduce((s, l: any) => s + (l.valor_total ?? 0), 0);
  return { cenario: { ...cenario, ...descreverCenario(cenario) }, cmv_cliente_final: cmv, itens: linhas, total: Math.round(total * 100) / 100 };
}

/** Para itens precificados à mão (portas, mão de obra FixDoor...): aplica o ICMS do cenário a um valor líquido. */
export function aplicarIcms(cenario: Cenario, valorLiquido: number, importado: boolean) {
  const calc = calcular(cenario, importado);
  return { cenario: { ...cenario, ...descreverCenario(cenario) }, ...calc, valor_liquido: valorLiquido, valor_com_icms: comIcms(valorLiquido, calc.aliqFixDoor) };
}
