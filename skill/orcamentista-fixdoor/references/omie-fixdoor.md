# Omie FixDoor: orçamento = pedido de venda na etapa "00" (orçamento)

`app_hash`: `fixdoor-918f968`. Sempre rode `omie_descrever_operacao` antes da primeira inclusão da sessão: os campos podem mudar.

## 1. Cliente

- Procure pelo CNPJ com `geral/clientes:ListarClientes`, filtrando por `clientesFiltro.cnpj_cpf` (só dígitos ou formatado), ou com `ConsultarCliente`.
- Não existe → mostre os dados da Receita (`consultar_cnpj`) e **pergunte** antes de incluir (`geral/clientes:IncluirCliente`). O cadastro precisa ter UF. Se o Omie disser "Cliente sem a informação da UF", o problema é do cadastro: avise, não insista.
- Confira se a IE e o "contribuinte" do cadastro batem com o card. Se não baterem, avise: o cenário fiscal do Omie usa o cadastro.

## 2. Inclusão: `produtos/pedido:IncluirPedido`

Os orçamentos atuais da equipe (pedidos 56xx, out/2026) ficam na **etapa "00"**. Categoria, conta corrente e cenário fiscal **variam**. Por isso, antes de incluir, consulte o orçamento mais recente da FixDoor em etapa "00" (`ListarPedidos` com `apenas_resumo: "S"`, `ordem_descrescente: "S"`) e use os mesmos valores. Mostre esses valores na prévia; depois de confirmados, registre-os como aprendizado (categoria "omie").

Valores vistos em 30/10/2026 (referência, não fixos):

| Campo | Valor usual | Observação |
|---|---|---|
| `cabecalho.etapa` | `"00"` | orçamento (como os pedidos 5695, 5698 e 5699) |
| `cabecalho.codigo_pedido_integracao` | `ORC-RD-<deal_id>-<AAAAMMDDhhmm>` | obrigatório; serve para achar o orçamento depois e evitar duplicidade |
| `cabecalho.codigo_cliente` | código do cliente no Omie | |
| `cabecalho.data_previsao` | hoje + 15 dias (validade) | formato DD/MM/AAAA |
| `cabecalho.codigo_parcela` | conforme condição (ex.: `"A45"` = 45 dias) | `"000"` é recusado; liste com `produtos/formaspagvendas` se precisar |
| `informacoes_adicionais.codigo_categoria` | `"1.01.01"` | antes usava-se `"1.01.03"`; copie do orçamento recente |
| `informacoes_adicionais.codigo_conta_corrente` | `5617177019` (também aparece `1868394193`) | copie do orçamento recente; em dúvida, pergunte |
| `informacoes_adicionais.consumidor_final` | `"S"` se não contribuinte ou uso e consumo; `"N"` se revenda | confirme com a pessoa em caso de dúvida |
| `informacoes_adicionais.enviar_email` | `"N"` | o envio ao cliente é outra etapa |
| `informacoes_adicionais.codVend` | **por enquanto, vazio** (códigos ainda indisponíveis) | ver "Vendedor do orçamento" em `resumo-card.md` |
| `cabecalho.codigo_cenario_impostos` e `det[].inf_adic.codigo_cenario_impostos_item` | `5630354603` ou `5616661330` (os dois aparecem em out/2026) | copie do orçamento recente; em dúvida, pergunte |
| `det[].produto.codigo_produto` | `codigo_produto_omie` da tabela | sem código → não lança; pendência |
| `det[].produto.valor_unitario` | unitário **com ICMS** de `calcular_precos` | |
| `det[].ide.codigo_item_integracao` | `ORC-<deal_id>-<n>` | |
| `frete.modalidade` | FOB `"1"` · CIF `"0"` · sem frete `"9"` | CIF com cotação → `frete.valor_frete` |
| `observacoes.obs_venda` | texto padrão FixDoor preenchido | **quebras de linha = `|`** (é assim que os orçamentos atuais estão gravados) |

Itens de **mão de obra/instalação** em equipamento novo: entram como item do pedido. Use o produto ou serviço que a FixDoor já usa para isso; se não souber qual, pergunte e registre como aprendizado. O valor entra com ICMS aplicado (`aplicar_icms`), salvo se a pessoa disser outra coisa.

## 3. Depois de incluir

- `produtos/pedido:ConsultarPedido` com `codigo_pedido`: confira itens, total e observação. Use `apenas_resumo` nas listagens: a resposta completa é enorme.
- Guarde `numero_pedido` (o número que aparece na tela): ele vai para o registro, para a anotação, para o campo `N° DO PEDIDO DE VENDA` e para o **título do card** (`rd_adicionar_numero_titulo`, empresa "fixdoor").
- Para corrigir: `AlterarPedidoVenda` (o Omie não aceita `numero_pedido`/`origem_pedido` na alteração). Nunca inclua de novo para "corrigir".
