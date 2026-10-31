// Ferramentas adicionais do conector. Novas ferramentas entram aqui, sem mexer na rota principal.
import { z } from "zod";
import { consultarTipi } from "./tipi.ts";

type Seguro = <A>(fn: (a: A) => Promise<unknown>) => (a: A) => Promise<unknown>;

export function registrarExtras(server: any, seguro: Seguro) {
  server.tool("consultar_tipi", "Consulta a TIPI oficial (alíquota de IPI por NCM). Envie TODOS os NCMs do orçamento numa chamada só (aceita com ou sem pontos; usa os 8 primeiros dígitos). Devolve alíquota (null + nt=true quando 'NT'), exceções tarifárias (ex) e NCMs não encontrados.",
    { ncms: z.array(z.string()).min(1).max(200) },
    seguro(({ ncms }: any) => consultarTipi(ncms)));
}
