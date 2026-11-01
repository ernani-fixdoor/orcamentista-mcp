// Ferramentas adicionais do conector. Novas ferramentas entram aqui, sem mexer na rota principal.
import { z } from "zod";
import { consultarTipi } from "./tipi.ts";
import { calcularMolaDoco, precificarMolas, PRECO_KG_MOLA } from "./mola.ts";

type Seguro = <A>(fn: (a: A) => Promise<unknown>) => (a: A) => Promise<unknown>;

export function registrarExtras(server: any, seguro: Seguro) {
  server.tool("consultar_tipi", "Consulta a TIPI oficial (alíquota de IPI por NCM). Envie TODOS os NCMs do orçamento numa chamada só (aceita com ou sem pontos; usa os 8 primeiros dígitos). Devolve alíquota (null + nt=true quando 'NT'), exceções tarifárias (ex) e NCMs não encontrados.",
    { ncms: z.array(z.string()).min(1).max(200) },
    seguro(({ ncms }: any) => consultarTipi(ncms)));

  server.tool("calcular_mola", `Molas de torção (porta seccional). Dois modos:
(1) Pelos dados da porta: roda a calculadora oficial da DOCO e devolve as opções de mola (diâmetro interno, fio, comprimento, voltas, peso, ciclos) — a opção 1 é a recomendada.
(2) Pelas molas já especificadas (diâmetro interno, fio, comprimento): calcula o peso pela fórmula do aço (confere com a DOCO).
Em ambos, o preço é R$ ${PRECO_KG_MOLA}/kg = valor SEM ICMS por mola; aplique o ICMS depois com aplicar_icms. Leva ~10–20 s no modo 1.`,
    {
      largura_mm: z.number().optional().describe("Largura do vão (W)"),
      altura_mm: z.number().optional().describe("Altura do vão (H)"),
      peso_porta_kg: z.number().optional().describe("Peso total da porta (DW)"),
      peso_painel_inferior_kg: z.number().optional().describe("Peso do painel inferior (BS)"),
      tipo_porta: z.enum(["Standard", "Standard + Pitch", "High-Lift", "High-Lift + Pitch", "Vertical-Lift", "Low-HeadRoom"]).optional(),
      numero_molas: z.number().int().min(1).max(4).optional(),
      ciclos: z.number().int().optional().describe("12500, 15000, 25000, 35000, 50000 ou 100000"),
      acabamento: z.enum(["Normal", "Galvanized", "Shot Blasted"]).optional(),
      tambor: z.string().optional().describe("Tambor de cabo (início do código, ex.: '110140')"),
      lift_mm: z.number().optional(), pitch: z.number().optional(),
      molas: z.array(z.object({ diametro_interno_mm: z.number(), fio_mm: z.number(), comprimento_mm: z.number(), quantidade: z.number().int().min(1) })).optional()
        .describe("Modo 2: molas já especificadas"),
    },
    seguro(async (a: any) => {
      if (a.molas?.length) return { modo: "molas informadas", ...precificarMolas(a.molas) };
      for (const k of ["largura_mm", "altura_mm", "peso_porta_kg", "peso_painel_inferior_kg"]) {
        if (!(a[k] > 0)) throw new Error(`Para usar a calculadora informe largura_mm, altura_mm, peso_porta_kg e peso_painel_inferior_kg (faltou ${k}). Ou informe as molas já especificadas em "molas".`);
      }
      return { modo: "calculadora DOCO", ...(await calcularMolaDoco(a)) };
    }));
}
