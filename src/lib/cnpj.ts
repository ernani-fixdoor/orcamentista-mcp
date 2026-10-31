// Consulta de CNPJ: BrasilAPI (mesma fonte do consultor de ICMS) com reserva na publica.cnpj.ws,
// que também traz as inscrições estaduais.

export interface DadosCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  uf: string;
  municipio: string;
  situacao: string;
  simples_nacional: boolean | null;
  mei: boolean | null;
  cnae_principal: string | null;
  inscricoes_estaduais?: { uf: string; ie: string; ativa: boolean }[];
  fonte: string;
}

const limpar = (c: string) => String(c ?? "").replace(/\D/g, "");

export async function consultarCnpj(cnpj: string): Promise<DadosCnpj> {
  const n = limpar(cnpj);
  if (n.length !== 14) throw new Error("CNPJ inválido: informe os 14 dígitos.");
  const erros: string[] = [];
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${n}`, { cache: "no-store" });
    if (r.ok) {
      const d: any = await r.json();
      return {
        cnpj: n, razao_social: String(d.razao_social ?? ""), nome_fantasia: d.nome_fantasia || null,
        uf: String(d.uf ?? ""), municipio: String(d.municipio ?? ""), situacao: String(d.descricao_situacao_cadastral ?? ""),
        simples_nacional: d.opcao_pelo_simples ?? null, mei: d.opcao_pelo_mei ?? null,
        cnae_principal: d.cnae_fiscal ? `${d.cnae_fiscal} ${d.cnae_fiscal_descricao ?? ""}`.trim() : null,
        fonte: "BrasilAPI",
      };
    }
    erros.push(`BrasilAPI ${r.status}`);
  } catch (e) { erros.push(`BrasilAPI: ${(e as Error).message}`); }
  try {
    const r = await fetch(`https://publica.cnpj.ws/cnpj/${n}`, { cache: "no-store" });
    if (r.ok) {
      const d: any = await r.json();
      const est = d.estabelecimento ?? {};
      return {
        cnpj: n, razao_social: String(d.razao_social ?? ""), nome_fantasia: est.nome_fantasia || null,
        uf: String(est.estado?.sigla ?? ""), municipio: String(est.cidade?.nome ?? ""), situacao: String(est.situacao_cadastral ?? ""),
        simples_nacional: d.simples ? d.simples.simples === "Sim" : null, mei: d.simples ? d.simples.mei === "Sim" : null,
        cnae_principal: est.atividade_principal ? `${est.atividade_principal.id} ${est.atividade_principal.descricao}` : null,
        inscricoes_estaduais: (est.inscricoes_estaduais ?? []).map((i: any) => ({ uf: i.estado?.sigla, ie: i.inscricao_estadual, ativa: !!i.ativo })),
        fonte: "publica.cnpj.ws",
      };
    }
    erros.push(`cnpj.ws ${r.status}`);
  } catch (e) { erros.push(`cnpj.ws: ${(e as Error).message}`); }
  throw new Error(`Não consegui consultar o CNPJ (${erros.join("; ")}).`);
}
