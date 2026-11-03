# Omie FixDoor: orçamento = pedido de venda na etapa "00" (orçamento)

`app_hash`: `fixdoor-918f968`. Sempre rode `omie_descrever_operacao` antes da primeira inclusão da sessão: os campos podem mudar.

## 1. Cliente

- Procure pelo CNPJ com `geral/clientes:ListarClientes`, filtrando por `clientesFiltro.cnpj_cpf` (só dígitos ou formatado), ou com `ConsultarCliente`.
- Não existe → **cadastre** com `geral/clientes:IncluirCliente` (o Ernani autorizou cadastrar clientes novos sem perguntar a cada vez). Se o CNPJ não achar, tente também a razão social. Mostre na prévia que o cliente é novo e o que foi cadastrado. Campos do cadastro:
  - **Receita** (`consultar_cnpj`): razão social, CNPJ, endereço, CEP, cidade (`"MONTE ALEGRE DO SUL (SP)"`), UF, IE, CNAE, `contribuinte`. O `consultar_cnpj` pode não trazer endereço: nesse caso use o do documento de dados cadastrais do card ou peça à pessoa.
  - **Contato, e-mail(s) e telefone: o que está no card do RD tem prioridade** sobre a Receita (a API do RD pode devolver `contatos` vazio mesmo com contato no card; veja também os arquivos do card). Dá para manter o telefone da Receita como segundo.
  - **O Omie exige e-mail**: sem e-mail no RD, na Receita e nos arquivos do card, pergunte; não invente.
  - **Tag** `"Cliente"` (`tags: [{"tag": "Cliente"}]`).
  - **Vendedor padrão** (`recomendacoes.codigo_vendedor`) = vendedor do orçamento.
  - `codigo_cliente_integracao` obrigatório: use `RD-<deal_id>`.
  O cadastro precisa ter UF. Se o Omie disser "Cliente sem a informação da UF", o problema é do cadastro: avise, não insista.
- Cliente que **nunca comprou** na FixDoor (sem pedidos): pagamento à vista. Veja "Pagamento à vista" mais abaixo.
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
| `cabecalho.codigo_parcela` | conforme condição (ex.: `"A15"` = 15 dias, `"A45"` = 45 dias) | liste com `produtos/formaspagvendas` se precisar. **À vista:** o `IncluirPedido` recusa `"000"`; veja "Pagamento à vista" abaixo |
| `informacoes_adicionais.codigo_categoria` | `"1.01.01"` | antes usava-se `"1.01.03"`; copie do orçamento recente |
| `informacoes_adicionais.codigo_conta_corrente` | `5617177019` (também aparece `1868394193`) | copie do orçamento recente; em dúvida, pergunte |
| `informacoes_adicionais.consumidor_final` | `"S"` se não contribuinte ou uso e consumo; `"N"` se revenda | confirme com a pessoa em caso de dúvida |
| `informacoes_adicionais.enviar_email` | `"N"` | o envio ao cliente é outra etapa |
| `informacoes_adicionais.codVend` | **sempre preencha** o vendedor do orçamento. Tom = `5412345808` | ver "Vendedor do orçamento" em `resumo-card.md` |
| `cabecalho.codigo_cenario_impostos` e `det[].inf_adic.codigo_cenario_impostos_item` | molas e peças de produção: **"Produção" = `5616661330`**. Outros: "Revenda de Mercadorias" = `5630354603` (padrão), "Revenda de Mercadorias - IMPORTADAS" = `5629889827` | escolha pelo **nome** do cenário (`geral/cenarios:ListarCenarios`), não copie o código de um pedido recente: os pedidos recentes misturam cenários |
| `det[].produto.codigo_produto` | `codigo_produto_omie` da tabela | sem código → não lança; pendência |
| `det[].produto.valor_unitario` | unitário **com ICMS** de `calcular_precos` | |
| `det[].ide.codigo_item_integracao` | `ORC-<deal_id>-<n>` | |
| `det[].observacao.obs_item` | observações do item (aparecem impressas no pedido) | **tópicos com hífen, uma linha por tópico, com quebra de linha real `\n` e nunca `\|`** (no item o `\|` aparece visível; a API devolve a quebra como `\|` na leitura, mas o PDF sai certo). Molas: veja `molas.md` |
| `frete.modalidade` | FOB `"1"` · CIF `"0"` · sem frete `"9"` | CIF com cotação → `frete.valor_frete` |
| `observacoes.obs_venda` | texto padrão FixDoor preenchido | **quebras de linha = `|`** (é assim que os orçamentos atuais estão gravados) |

**Pagamento à vista** (cliente que nunca comprou): o `IncluirPedido` recusa o código `"000"` e o `"001"` gera vencimento em 30 dias. Faça em dois passos:
1. Inclua com `codigo_parcela: "999"` e `lista_parcelas` com 1 parcela de 100% (`data_vencimento` = hoje, `valor` = total do pedido, incluindo o IPI que o Omie calcula).
2. Logo depois, `produtos/pedido:AlterarPedidoVenda` com `cabecalho: {codigo_pedido, codigo_cliente, etapa: "00", codigo_parcela: "000"}`. A condição passa a aparecer como **"A Vista"** (e não como "1" parcela). Com o `"000"`, o vencimento passa a ser a **data de previsão** do pedido (hoje + 15 dias), e não o dia da criação: avise a pessoa.
3. Confira no `ConsultarPedido` e no PDF ("Vencimentos A Vista").

Itens de **mão de obra/instalação** em equipamento novo: entram como item do pedido. Use o produto ou serviço que a FixDoor já usa para isso; se não souber qual, pergunte e registre como aprendizado. O valor entra com ICMS aplicado (`aplicar_icms`), salvo se a pessoa disser outra coisa.

## 3. Depois de incluir

- `produtos/pedido:ConsultarPedido` com `codigo_pedido`: confira itens, total e observação. Use `apenas_resumo` nas listagens: a resposta completa é enorme.
- Guarde `numero_pedido` (o número que aparece na tela): ele vai para o registro, para a anotação, para o campo `N° DO PEDIDO DE VENDA` e para o **título do card** (`rd_adicionar_numero_titulo`, empresa "fixdoor").
- Para corrigir: `AlterarPedidoVenda` (o Omie não aceita `numero_pedido`/`origem_pedido` na alteração). Nunca inclua de novo para "corrigir".
