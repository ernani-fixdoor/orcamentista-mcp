# Onde está cada informação no card do RD Station

Mapa conferido com a conta da FixDoor (31/10/2026). Os campos da **empresa** (organização) e os do **negócio** ficam em lugares diferentes no `rd_ler_negocio`:
- empresa: em `empresa.campos`;
- negócio: em `campos_personalizados`.

As anotações vêm em `rd_listar_anotacoes`, que é onde os vendedores escrevem o pedido, as medidas e as cotações.

## Campos da EMPRESA (`empresa.campos`)

| Rótulo | Uso | Observação |
|---|---|---|
| `CNPJ` | achar ou criar o cliente no Omie; `consultar_cnpj` | pode vir com espaços ou pontuação: limpe |
| `ESTADO` | UF de destino (ICMS) | confira com a UF da Receita e com o `LOCAL DA OBRA`, se houver |
| `CIDADE` | cidade do cliente | |
| `A EMPRESA É CONTRIBUINTE DO ICMS?` | `SIM` → contribuinte = true; `NÃO` → false | |
| `INSCRIÇÃO ESTADUAL` | conferência | se o card diz "SIM" mas a IE está vazia, ou o contrário, pergunte |

## Campos do NEGÓCIO (`campos_personalizados`)

| Rótulo | Valores | Como interpretar |
|---|---|---|
| `POR QUAL EMPRESA?` | FIXDOOR · MAXDOCK · FAST & SAFE | empresa do orçamento. FAST & SAFE fica fora deste processo: avise |
| `DESTINAÇÃO DO PRODUTO` | ATIVO IMOBILIZADO → `ativo` · USO E CONSUMO → `uso` · REVENDA → `revenda` · NÃO SE APLICA (SERVIÇOS) | "não se aplica" = só serviço (MaxDock), sem ICMS de produto |
| `ITENS DA SOLICITAÇÃO` | texto livre | o que foi pedido; complete com as anotações (medidas, modelo, vendedor) |
| `MÃO DE OBRA` | texto livre | "X", "NÃO", "N" ou vazio = **sem mão de obra**. Qualquer outro texto descreve a mão de obra pedida |
| `EQUIPE DE MONTAGEM` | lista: MaxDock, Imperial Montagens - SP, Door Montagens - RJ, Raimundo - Nordeste, Precisão - MG, REF - RS, Alfa - SC, Santech - GO, Isolmarc - MG, Outros | MaxDock → OS na MaxDock; demais → terceiro (cotação nas anotações ou pendente) |
| `POR QUAL EQUIPE?` | texto | detalhe da equipe, principalmente quando for "Outros" |
| `PAGAMENTO` | FATURAMENTO DIRETO PARA O TERCEIRO · FATURAMENTO PARA MAX · FATURAMENTO PARA FIX | quem fatura a mão de obra. "Direto para o terceiro" = não entra em nenhum orçamento nosso, só citar no texto |
| `PRAZO DE PAGAMENTO` | texto | preenche o "PRAZO DE PAGAMENTO" do texto padrão; vazio → pergunte |
| `FRETE` | CIF · FOB · NÃO · INDICAÇÃO | ver abaixo |
| `DESCRIÇÃO DO SERVIÇO` | texto | base da descrição da OS MaxDock |
| `LOCAL DA OBRA` | texto | cidade do serviço (`cCidPrestServ`) e pista de UF de destino |
| `CONTATO COMERCIAL` | ANA · TOM · RENATA · YASMIN · LUCAS | vendedor; a anotação costuma repetir ("VENDEDOR: TOM") |
| `N° DO PEDIDO DE VENDA` | número | **a skill preenche** com o `numero_pedido` do Omie FixDoor ao criar o orçamento (id `6acf88980eb7250022f0de8d`) |

### Frete

| Valor no card | Texto e Omie |
|---|---|
| `FOB` | "FOB- Por conta do cliente - retirar em Pinhais / PR"; modalidade `"1"` |
| `INDICAÇÃO` | "FOB - Indicação para faturamento direto entre transportadora e Cliente"; modalidade `"1"` |
| `CIF` | precisa de cotação. **Com ou sem descarga**: procure nas anotações. Se não estiver lá, pergunte. Modalidade `"0"` |
| `NÃO` | sem frete; modalidade `"9"` |

### Locação (PTA, MUNC)
Não há campo próprio. Procure nas anotações, em `DESCRIÇÃO DO SERVIÇO` e em `ITENS DA SOLICITAÇÃO`.

## Etapas (funil COMERCIAL, id `6893ae5d35e1060014fea7a6`)

| Etapa | id | Uso |
|---|---|---|
| ORÇAMENTO | `6893ae5d35e1060014fea7ac` | fila de entrada: `rd_buscar_negocios` com `etapa_id` lista o que está esperando orçamento |
| **APROVAÇÃO** | `69408c3c404dbe001655f7dd` | destino ao concluir (`rd_mover_negocio`) |
| ANÁLISE DE PROPOSTA | `68a62a575c06d8001a136265` | depois da aprovação (não é papel da skill) |

## Arquivos do card

A API do RD Station **não entrega os anexos** dos cards. Não existe rota de arquivos, e as anotações vêm só como texto. Por isso:
- pergunte se o card tem arquivos (fotos, formulário técnico, levantamento);
- se tiver, peça que a pessoa **arraste os arquivos para a conversa**. Siga a regra de leitura do SKILL.md: o documento sempre; as fotos quando necessário.
