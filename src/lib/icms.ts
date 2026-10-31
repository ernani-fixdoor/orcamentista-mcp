// Regras de ICMS/DIFAL da FixDoor, copiadas da tabela de preços
// (ernani-fixdoor/tabela-precos-fixdoor, src/lib/icms.ts e src/lib/preco.ts), que por sua vez
// copiou do consultor https://www.fixdoor.com.br/consultor-icms-difal.
// Se as alíquotas mudarem lá, atualize aqui também.
//
// Origem das vendas: Paraná (PR).
// Preço líquido (sem ICMS)  = custo × peso ÷ CMV          (CMV do cliente final)
// Preço com ICMS            = preço líquido ÷ (1 − alíquota que a FixDoor suporta)   ("por dentro")

export const arred = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const ALIQUOTAS: Record<string, { aliq: number; estado: string }> = {
  AC: { aliq: 19, estado: "Acre" }, AL: { aliq: 20, estado: "Alagoas" }, AM: { aliq: 20, estado: "Amazonas" }, AP: { aliq: 18, estado: "Amapá" },
  BA: { aliq: 20.5, estado: "Bahia" }, CE: { aliq: 20, estado: "Ceará" }, DF: { aliq: 20, estado: "Distrito Federal" }, ES: { aliq: 17, estado: "Espírito Santo" },
  GO: { aliq: 19, estado: "Goiás" }, MA: { aliq: 22, estado: "Maranhão" }, MG: { aliq: 18, estado: "Minas Gerais" }, MS: { aliq: 17, estado: "Mato Grosso do Sul" },
  MT: { aliq: 17, estado: "Mato Grosso" }, PA: { aliq: 19, estado: "Pará" }, PB: { aliq: 20, estado: "Paraíba" }, PE: { aliq: 20.5, estado: "Pernambuco" },
  PI: { aliq: 21, estado: "Piauí" }, PR: { aliq: 19.5, estado: "Paraná" }, RJ: { aliq: 22, estado: "Rio de Janeiro" }, RN: { aliq: 18, estado: "Rio Grande do Norte" },
  RO: { aliq: 19.5, estado: "Rondônia" }, RR: { aliq: 20, estado: "Roraima" }, RS: { aliq: 17, estado: "Rio Grande do Sul" }, SC: { aliq: 17, estado: "Santa Catarina" },
  SE: { aliq: 20, estado: "Sergipe" }, SP: { aliq: 18, estado: "São Paulo" }, TO: { aliq: 20, estado: "Tocantins" },
};

/** Alíquota interestadual de importados (Res. Senado 13/2012). */
export const ICMS_IMPORTADO = 4;
/** Dentro do PR vale a alíquota interna cheia, mesmo para importado. */
export const IMPORTADO_4_NA_VENDA_INTERNA = false;

// Saindo do PR (Res. SF 22/89): 12% para MG, RJ, SP, RS e SC; 7% para os demais.
const INTERESTADUAL_12 = ["MG", "RJ", "SP", "RS", "SC"];
const aliqInterestadual = (uf: string) => (INTERESTADUAL_12.includes(uf) ? 12 : 7);

/** Origem da mercadoria no Omie (tabela A do SPED). 1, 2, 3 e 8 = importado / conteúdo importado > 40%. */
export const ORIGENS: Record<string, string> = {
  "0": "Nacional", "1": "Estrangeira, importação direta", "2": "Estrangeira, adquirida no mercado interno",
  "3": "Nacional, conteúdo importado maior que 40% e até 70%", "4": "Nacional, processos produtivos básicos",
  "5": "Nacional, conteúdo importado até 40%", "6": "Estrangeira, importação direta sem similar nacional",
  "7": "Estrangeira, mercado interno sem similar nacional", "8": "Nacional, conteúdo importado maior que 70%",
};
const ORIGENS_ICMS_4 = ["1", "2", "3", "8"];
export const origemImportada = (origem: string | null | undefined) => origem != null && ORIGENS_ICMS_4.includes(String(origem));

export type Destinacao = "ativo" | "uso" | "revenda";

export interface Cenario {
  uf: string;
  /** cliente tem Inscrição Estadual (contribuinte de ICMS) */
  contribuinte: boolean;
  destinacao: Destinacao;
  simples?: boolean;
}

export interface Calculo {
  /** % que a FixDoor suporta e embute no preço (base do "por dentro"). */
  aliqFixDoor: number;
  /** % de ICMS destacado na NF. */
  aliqNF: number;
  /** % de DIFAL. */
  difal: number;
  /** quem recolhe o DIFAL ("fixdoor" já está dentro de aliqFixDoor). */
  difalPor: "fixdoor" | "cliente" | null;
}

export function normalizarUf(uf: string): string {
  const u = String(uf ?? "").trim().toUpperCase();
  if (!ALIQUOTAS[u]) throw new Error(`UF inválida: "${uf}". Use a sigla (ex.: SP, PR).`);
  return u;
}

/** Alíquotas do cenário para um item. */
export function calcular(c: Cenario, importado: boolean): Calculo {
  const uf = normalizarUf(c.uf);
  const interna = ALIQUOTAS[uf].aliq;
  if (uf === "PR") {
    const aliq = importado && IMPORTADO_4_NA_VENDA_INTERNA ? ICMS_IMPORTADO : interna;
    return { aliqFixDoor: aliq, aliqNF: aliq, difal: 0, difalPor: null };
  }
  const inter = importado ? ICMS_IMPORTADO : aliqInterestadual(uf);
  const difal = +(interna - inter).toFixed(2);
  if (c.destinacao === "revenda" && c.contribuinte) return { aliqFixDoor: inter, aliqNF: inter, difal: 0, difalPor: null };
  if (!c.contribuinte) return { aliqFixDoor: interna, aliqNF: inter, difal, difalPor: "fixdoor" };
  return { aliqFixDoor: inter, aliqNF: inter, difal, difalPor: difal > 0 ? "cliente" : null };
}

export function descreverCenario(c: Cenario): { titulo: string; descricao: string; nota: string } {
  const uf = normalizarUf(c.uf);
  const { contribuinte, destinacao, simples } = c;
  if (uf === "PR") return { titulo: "Operação interna (PR)", descricao: "FixDoor destaca e recolhe o ICMS integral; sem DIFAL.", nota: contribuinte && destinacao === "ativo" && !simples ? "Cliente contribuinte pode creditar via CIAP em 48 meses." : "" };
  if (destinacao === "revenda" && contribuinte) return { titulo: "Revenda", descricao: "Só o ICMS interestadual na NF; não há DIFAL. O cliente credita e debita na revenda.", nota: "" };
  if (!contribuinte) return { titulo: "Cliente sem IE (não contribuinte)", descricao: "FixDoor recolhe o ICMS da NF e também o DIFAL (GNRE antes do embarque): a carga inteira entra no preço.", nota: "O cliente não pode creditar nada." };
  if (simples) return { titulo: "Simples Nacional", descricao: "FixDoor destaca o interestadual; o cliente recolhe o DIFAL pelo regime do Simples.", nota: "Sem direito a CIAP (Simples Nacional)." };
  if (destinacao === "ativo") return { titulo: "Contribuinte · ativo imobilizado", descricao: "FixDoor destaca o interestadual; o cliente recolhe o DIFAL e credita tudo via CIAP em 48 meses.", nota: "Argumento comercial: crédito integral para o cliente." };
  return { titulo: "Contribuinte · uso e consumo", descricao: "FixDoor destaca o interestadual; o cliente recolhe o DIFAL, sem crédito.", nota: "Avalie se a porta pode ser classificada como ativo imobilizado (libera o CIAP)." };
}

export function precoLiquido(custo: number | null, peso: number | null, cmv: number): number | null {
  if (custo == null || peso == null || !(cmv > 0)) return null;
  return arred((custo * peso) / cmv);
}

export function comIcms(liquido: number | null, aliq: number): number | null {
  if (liquido == null) return null;
  if (!(aliq >= 0 && aliq < 100)) return null;
  return arred(liquido / (1 - aliq / 100));
}
