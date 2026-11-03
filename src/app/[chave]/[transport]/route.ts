// Conector MCP do Orçamentista. URL: https://<projeto>.vercel.app/<MCP_CHAVE>/mcp
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import * as rd from "../../../lib/rd.ts";
import * as rdv2 from "../../../lib/rdv2.ts";
import { anexarNoOmie } from "../../../lib/omie.ts";
import { consultarCnpj } from "../../../lib/cnpj.ts";
import { aplicarIcms, buscarItens, calcularPrecos } from "../../../lib/precos.ts";
import { registrarExtras } from "../../../lib/ferramentas-extra.ts";
import { definirStatusAprendizado, historicoDoNegocio, listarAprendizados, proporAprendizado, registrarOrcamento } from "../../../lib/aprendizado.ts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (dados: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(dados, null, 1) }] });
const erro = (e: unknown) => ({ isError: true, content: [{ type: "text" as const, text: `Erro: ${(e as Error).message}` }] });
const seguro = <A,>(fn: (a: A) => Promise<unknown>) => async (a: A) => { try { return json(await fn(a)); } catch (e) { return erro(e); } };

const cenario = {
  uf: z.string().describe("UF de destino da mercadoria (ex.: SP, PR)"),
  contribuinte: z.boolean().describe("Cliente tem Inscrição Estadual (contribuinte de ICMS)?"),
  destinacao: z.enum(["ativo", "uso", "revenda"]).describe("Destinação: ativo imobilizado, uso e consumo ou revenda"),
  simples: z.boolean().optional().describe("Cliente é optante do Simples Nacional (só muda a observação, não a alíquota)"),
};

function registrar(server: any) {
  // ---------------- RD Station CRM ----------------
  server.tool("rd_buscar_negocios", "Procura negócios (cards) no RD Station CRM pelo nome (normalmente o nome do cliente) ou pela etapa.",
    { nome: z.string().optional(), etapa_id: z.string().optional(), pagina: z.number().int().optional(), limite: z.number().int().optional() },
    seguro(async (a: any) => {
      const r: any = await rd.buscarNegocios(a);
      return { total: r?.total, tem_mais: r?.has_more, negocios: (r?.deals ?? []).map((d: any) => ({ id: d._id ?? d.id, nome: d.name, etapa: d.deal_stage?.name, responsavel: d.user?.name, atualizado_em: d.updated_at })) };
    }));

  server.tool("rd_ler_negocio", "Lê um card (negócio) do RD Station: empresa, contatos, etapa, produtos e TODOS os campos personalizados (CNPJ, destino fiscal, IE, mão de obra, equipe de montagem, frete, observações...). Use bruto=true para ver a resposta original da API.",
    { deal_id: z.string(), bruto: z.boolean().optional() },
    seguro(async ({ deal_id, bruto }: any) => {
      const d = await rd.lerNegocio(deal_id);
      return bruto ? d : rd.resumirNegocio(d);
    }));

  server.tool("rd_listar_anotacoes", "Lista o histórico de anotações do card (notas, cotações coladas pelos vendedores...).",
    { deal_id: z.string() },
    seguro(async ({ deal_id }: any) => {
      const r: any = await rd.listarAnotacoes(deal_id);
      const lista = r?.activities ?? r ?? [];
      return (Array.isArray(lista) ? lista : []).map((a: any) => ({ id: a._id ?? a.id, data: a.date ?? a.created_at, autor: a.user?.name ?? a.user_id, texto: a.text }));
    }));

  server.tool("rd_listar_tarefas", "Lista as tarefas do card (abertas e concluídas).",
    { deal_id: z.string() },
    seguro(async ({ deal_id }: any) => {
      const r: any = await rd.listarTarefas(deal_id);
      const lista = r?.tasks ?? r ?? [];
      return (Array.isArray(lista) ? lista : []).map((t: any) => ({ id: t._id ?? t.id, assunto: t.subject, tipo: t.type, data: t.date, hora: t.hour, concluida: t.done, responsaveis: (t.users ?? []).map((u: any) => u.name), notas: t.notes }));
    }));

  server.tool("rd_criar_tarefa", "Cria uma tarefa no card do RD Station (ex.: 'Cotação de frete em andamento'). Data padrão: próximo dia útil, 09:00. Sem usuario_ids, fica com o responsável do card.",
    { deal_id: z.string(), assunto: z.string(), descricao: z.string().optional(), tipo: z.string().optional().describe("task, call, email, meeting, visit, whatsapp..."), data: z.string().optional().describe("AAAA-MM-DD"), hora: z.string().optional().describe("HH:MM"), usuario_ids: z.array(z.string()).optional() },
    seguro(async (a: any) => {
      let usuario_ids = a.usuario_ids;
      if (!usuario_ids?.length) {
        const d: any = await rd.lerNegocio(a.deal_id);
        const u = d?.user?._id ?? d?.user?.id;
        if (u) usuario_ids = [String(u)];
      }
      return rd.criarTarefa({ ...a, usuario_ids, data: a.data ?? rd.proximoDiaUtil(), hora: a.hora ?? "09:00" });
    }));

  server.tool("rd_criar_anotacao", "Registra uma anotação no histórico do card (ex.: resumo do orçamento criado, números do Omie).",
    { deal_id: z.string(), texto: z.string() },
    seguro(({ deal_id, texto }: any) => rd.criarAnotacao(deal_id, texto)));

  server.tool("rd_listar_funis", "Lista os funis e as etapas do RD Station, com os ids (para achar a etapa de aprovação).",
    {},
    seguro(async () => {
      const funis: any = await rd.listarFunis();
      const lista = Array.isArray(funis) ? funis : funis?.deal_pipelines ?? [];
      return lista.map((f: any) => ({ id: f._id ?? f.id, nome: f.name, etapas: (f.deal_stages ?? []).map((e: any) => ({ id: e._id ?? e.id, nome: e.name, ordem: e.order })) }));
    }));

  server.tool("rd_mover_negocio", "Move o card para outra etapa (ex.: etapa de aprovação). Use o id da etapa vindo de rd_listar_funis.",
    { deal_id: z.string(), etapa_id: z.string() },
    seguro(async ({ deal_id, etapa_id }: any) => rd.resumirNegocio(await rd.moverNegocio(deal_id, etapa_id))));

  server.tool("rd_renomear_negocio", "Altera o título (nome) do card. Prefira rd_adicionar_numero_titulo para colocar o número do orçamento no padrão da equipe.",
    { deal_id: z.string(), nome: z.string().min(3) },
    seguro(async ({ deal_id, nome }: any) => {
      const antes: any = await rd.lerNegocio(deal_id);
      const depois: any = await rd.renomearNegocio(deal_id, nome.trim());
      return { antes: antes?.name, depois: depois?.name ?? nome.trim() };
    }));

  server.tool("rd_adicionar_numero_titulo", "Acrescenta o número do orçamento ao título do card no padrão da equipe: ' | N° 5695 🟧' (pedido FixDoor), ' | N° 1923 🟦' (OS MaxDock) ou ' | N° 276 🟩' (pedido Fast & Safe). Não repete se o número já estiver no título.",
    { deal_id: z.string(), empresa: z.enum(["fixdoor", "maxdock", "fast"]), numero: z.string() },
    seguro(async ({ deal_id, empresa, numero }: any) => {
      const atual: any = await rd.lerNegocio(deal_id);
      const novo = rd.tituloComNumero(atual?.name ?? "", empresa, numero);
      if (novo === String(atual?.name ?? "").replace(/\s+$/, "")) return { alterado: false, titulo: atual?.name, motivo: "o número já está no título" };
      const depois: any = await rd.renomearNegocio(deal_id, novo);
      return { alterado: true, antes: atual?.name, depois: depois?.name ?? novo };
    }));

  server.tool("rd_listar_produtos_catalogo", "Lista os produtos cadastrados no RD (categorias usadas para o valor do card): Peças e Partes - Porta Seccional, Portas Seccionais - Equip. Novos, Serviços - MaxDock etc.",
    {},
    seguro(() => rd.catalogoProdutos()));

  server.tool("rd_definir_valor_produtos", "Define os PRODUTOS do card e, com isso, o VALOR da negociação (o RD soma os produtos). Uma linha por categoria do catálogo, quantidade 1, valor = soma dos itens daquela categoria. Os valores devem ser SÓ o valor dos produtos/serviços: SEM IPI, SEM ICMS-ST, SEM frete e SEM itens de locação. Use remover_outros=true na criação do orçamento ou quando a pessoa confirmar que as linhas antigas devem sair.",
    { deal_id: z.string(), produtos: z.array(z.object({ produto: z.string().describe("Nome ou id do produto do catálogo do RD"), valor: z.number() })).min(1), remover_outros: z.boolean().default(false) },
    seguro(({ deal_id, produtos, remover_outros }: any) => rd.definirProdutosNegocio(deal_id, produtos, remover_outros)));

  server.tool("rd_listar_produtos_negocio", "Lista os produtos já lançados no card (categoria, preço, total).",
    { deal_id: z.string() },
    seguro(({ deal_id }: any) => rd.listarProdutosNegocio(deal_id)));

  server.tool("rd_listar_campos", "Lista os campos personalizados de negócio do RD (id, rótulo, tipo, opções).",
    {},
    seguro(async () => {
      const r: any = await rd.listarCamposPersonalizados();
      const lista = r?.custom_fields ?? r ?? [];
      return (Array.isArray(lista) ? lista : []).map((c: any) => ({ id: c._id ?? c.id, rotulo: c.label, tipo: c.type, opcoes: c.opts, obrigatorio: c.required }));
    }));

  server.tool("rd_atualizar_campos", "Preenche campos personalizados do card (ex.: número do orçamento Omie, valor). Use os ids de rd_listar_campos.",
    { deal_id: z.string(), campos: z.array(z.object({ custom_field_id: z.string(), valor: z.any() })) },
    seguro(async ({ deal_id, campos }: any) => rd.resumirNegocio(await rd.atualizarCampos(deal_id, campos))));

  server.tool("rd_consulta_api", "Leitura livre (GET) na API v1 do RD Station CRM, para investigar o que não tem ferramenta própria (ex.: anexos/arquivos do card). Ex.: caminho='deals/ID', parametros={}.",
    { caminho: z.string(), parametros: z.record(z.string()).optional() },
    seguro(({ caminho, parametros }: any) => rd.rd("GET", caminho, { query: parametros })));

  server.tool("rd_baixar_arquivo", "Baixa um arquivo anexado (por URL https) e devolve imagem ou texto. PDFs voltam como recurso. Use para o documento técnico do card e, quando necessário, as fotos.",
    { url: z.string().url() },
    async ({ url }: any) => {
      try {
        const u = new URL(url);
        if (u.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) throw new Error("Só URLs https públicas.");
        const r = await fetch(u, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const tipo = (r.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 8 * 1024 * 1024) throw new Error(`Arquivo grande demais (${Math.round(buf.length / 1024 / 1024)} MB).`);
        if (tipo.startsWith("image/")) return { content: [{ type: "image", data: buf.toString("base64"), mimeType: tipo }] };
        if (tipo.startsWith("text/") || tipo.includes("json")) return { content: [{ type: "text", text: buf.toString("utf8").slice(0, 100_000) }] };
        return { content: [{ type: "resource", resource: { uri: url, mimeType: tipo, blob: buf.toString("base64") } }] };
      } catch (e) { return erro(e); }
    });

  // ---------------- RD Station API v2: anexos ----------------
  server.tool("rd_anexar_arquivo", "Anexa um arquivo ao card (aba de arquivos do RD) a partir de uma URL https. Uso principal: o PDF da proposta gerado pelo Omie (FixDoor: produtos/dfedocs:ObterPedVenda → cPdfPed; MaxDock: servicos/osdocs:ObterOS). Informe nome_arquivo legível, ex.: 'Proposta 5701 - FixDoor.pdf'.",
    { deal_id: z.string(), url: z.string().url(), nome_arquivo: z.string().optional() },
    seguro(({ deal_id, url, nome_arquivo }: any) => rdv2.anexarDeUrl(deal_id, url, nome_arquivo)));

  server.tool("rd_listar_arquivos", "Lista os arquivos anexados ao card (nome, id, link).",
    { deal_id: z.string() },
    seguro(({ deal_id }: any) => rdv2.listarArquivos(deal_id)));

  server.tool("rd_excluir_arquivo", "EXCLUI permanentemente um arquivo do card. Só use depois de mostrar o nome do arquivo à pessoa e ela confirmar explicitamente; então envie confirmado=true.",
    { deal_id: z.string(), arquivo_id: z.string(), confirmado: z.boolean() },
    seguro(async ({ deal_id, arquivo_id, confirmado }: any) => {
      if (confirmado !== true) throw new Error("Exclusão não confirmada. Mostre o arquivo à pessoa e só repita com confirmado=true se ela autorizar.");
      await rdv2.excluirArquivo(deal_id, arquivo_id);
      return { excluido: true, arquivo_id };
    }));

  // ---------------- Omie: anexos ----------------
  server.tool("omie_anexar_arquivo", "Anexa um arquivo ao pedido de venda (FixDoor) ou à ordem de serviço (MaxDock) do Omie, a partir de uma URL https pública (o conector baixa, compacta em ZIP e envia). Uso principal: o PDF de cálculo da mola (botão Print da calculadora DOCO) e outros documentos do orçamento. `id` é o código interno do documento: `codigo_pedido` do pedido de venda (ex.: 5631832130, NÃO o número 5712) ou `nCodOS` da OS. Nunca usar a Fast & Safe. Precisa das variáveis OMIE_<EMPRESA>_APP_KEY e OMIE_<EMPRESA>_APP_SECRET na Vercel.",
    { empresa: z.enum(["fixdoor", "maxdock"]), id: z.number().int().positive().describe("codigo_pedido (FixDoor) ou nCodOS (MaxDock)"), url: z.string().url(), nome_arquivo: z.string().optional().describe("Nome legível com extensão, ex.: 'Calculo da mola - Pedido 5712 (DOCO).pdf'"), tabela: z.enum(["pedido-venda", "ordem-servico"]).optional().describe("Padrão: pedido-venda na FixDoor, ordem-servico na MaxDock") },
    seguro(({ empresa, id, url, nome_arquivo, tabela }: any) =>
      anexarNoOmie({ empresa, id, url, nome_arquivo, tabela: tabela ?? (empresa === "fixdoor" ? "pedido-venda" : "ordem-servico") })));

  server.tool("rd_editar_anotacao", "EXPERIMENTAL: altera o texto de uma anotação do card (a API v2 não documenta essa operação; se o RD recusar, avise e crie uma anotação de correção). Só use depois de mostrar o texto atual e o novo à pessoa e ela confirmar; então envie confirmado=true. O RD não permite EXCLUIR anotações pela API.",
    { deal_id: z.string(), anotacao_id: z.string(), texto: z.string().min(1), confirmado: z.boolean() },
    seguro(async ({ deal_id, anotacao_id, texto, confirmado }: any) => {
      if (confirmado !== true) throw new Error("Edição não confirmada. Mostre o texto atual e o novo à pessoa e só repita com confirmado=true se ela autorizar.");
      return rdv2.editarAnotacao(deal_id, anotacao_id, texto);
    }));

  // ---------------- Cliente / fiscal ----------------
  server.tool("consultar_cnpj", "Consulta o CNPJ na Receita (BrasilAPI, reserva cnpj.ws): razão social, UF, município, situação, Simples Nacional, MEI e inscrições estaduais quando disponíveis.",
    { cnpj: z.string() },
    seguro(({ cnpj }: any) => consultarCnpj(cnpj)));

  // ---------------- Tabela de preços ----------------
  server.tool("tabela_buscar_itens", "Procura itens na tabela de preços FixDoor (cliente final). Busca por palavras da descrição, código ou grupo. Traz preço líquido sem ICMS, código Omie, origem e ALERTAS (sem código Omie, item a revisar, sem origem).",
    { texto: z.string().optional(), codigo: z.string().optional(), grupo: z.string().optional(), ids: z.array(z.number()).optional(), limite: z.number().int().optional() },
    seguro((a: any) => buscarItens(a)));

  server.tool("calcular_precos", "Calcula o preço final COM ICMS de itens da tabela FixDoor (cliente final), conforme UF de destino, contribuinte (IE) e destinação. Detecta importado (origem 1,2,3,8 = 4% fora do PR). Informe os itens por id (preferível) ou código.",
    { ...cenario, itens: z.array(z.object({ id: z.number().optional(), codigo: z.string().optional(), quantidade: z.number(), importado: z.boolean().optional().describe("Só se a origem estiver em branco na tabela e você confirmou no Omie") })) },
    seguro(({ itens, ...c }: any) => calcularPrecos(c, itens)));

  server.tool("aplicar_icms", "Aplica o ICMS do cenário a um valor líquido informado pela pessoa (itens precificados à mão: portas seccionais, mão de obra na FixDoor, itens fora da tabela).",
    { ...cenario, valor_liquido: z.number(), importado: z.boolean().default(false) },
    seguro(async ({ valor_liquido, importado, ...c }: any) => aplicarIcms(c, valor_liquido, importado)));

  // ---------------- Aprendizado ----------------
  server.tool("aprendizados_listar", "Lista as regras aprendidas (confirmadas) para aplicar no orçamento. Leia no início de todo orçamento.",
    { categoria: z.string().optional(), incluir_propostos: z.boolean().optional() },
    seguro((a: any) => listarAprendizados(a)));

  server.tool("aprendizado_propor", "Registra uma regra nova como PROPOSTA (ex.: correção que a pessoa fez). Só vale depois de confirmada.",
    { categoria: z.enum(["icms", "preco", "itens", "frete", "mao_de_obra", "locacao", "texto", "rd", "omie", "outro"]), regra: z.string(), exemplo: z.string().optional(), orcamento_id: z.number().optional(), criado_por: z.string().optional() },
    seguro((a: any) => proporAprendizado(a)));

  server.tool("aprendizado_definir_status", "Confirma, descarta ou edita uma regra. Use SOMENTE quando a pessoa responsável pedir explicitamente.",
    { id: z.number(), status: z.enum(["confirmado", "descartado", "proposto"]), quem: z.string().optional(), regra: z.string().optional() },
    seguro(({ id, status, quem, regra }: any) => definirStatusAprendizado(id, status, quem, regra)));

  server.tool("orcamento_registrar", "Cria (sem id) ou atualiza (com id) o registro do orçamento no histórico do Orçamentista: dados do card, empresa, números Omie, itens, pendências, correções e status.",
    {
      id: z.number().optional(), rd_deal_id: z.string().optional(), rd_deal_nome: z.string().optional(), usuario: z.string().optional(),
      cliente: z.string().optional(), cnpj: z.string().optional(), uf: z.string().optional(), contribuinte: z.boolean().optional(),
      simples_nacional: z.boolean().optional(), destinacao: z.string().optional(), empresa: z.string().optional(), tipo: z.string().optional(),
      omie_fixdoor: z.string().optional(), omie_maxdock: z.string().optional(), mao_de_obra: z.string().optional(), frete: z.string().optional(),
      locacao: z.string().optional(), itens: z.any().optional(), pendencias: z.any().optional(), correcoes: z.any().optional(),
      status: z.enum(["rascunho", "criado_omie", "em_aprovacao", "aprovado", "reprovado"]).optional(), resumo: z.string().optional(),
    },
    seguro((a: any) => registrarOrcamento(a)));

  registrarExtras(server, seguro as any);

  server.tool("orcamento_historico", "Orçamentos já registrados para um card do RD (evita refazer e mostra o que foi feito antes).",
    { rd_deal_id: z.string() },
    seguro(({ rd_deal_id }: any) => historicoDoNegocio(rd_deal_id)));
}

let cache: { base: string; h: (r: Request) => Promise<Response> } | null = null;
function handler(chave: string) {
  const base = `/${chave}`;
  if (!cache || cache.base !== base) {
    cache = {
      base,
      h: createMcpHandler(registrar, { serverInfo: { name: "orcamentista-fixdoor", version: "0.1.0" } }, { basePath: base, maxDuration: 60, disableSse: true }),
    };
  }
  return cache.h;
}

async function rota(req: Request, ctx: { params: Promise<{ chave: string; transport: string }> }) {
  const { chave } = await ctx.params;
  const esperada = process.env.MCP_CHAVE;
  if (!esperada || esperada.length < 16 || chave !== esperada) return new Response("Not found", { status: 404 });
  return handler(chave)(req);
}

export { rota as GET, rota as POST, rota as DELETE };
