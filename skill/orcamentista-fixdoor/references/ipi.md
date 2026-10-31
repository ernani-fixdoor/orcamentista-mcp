# Conferência do IPI pela TIPI

A FixDoor **fabrica e industrializa** muitos produtos: esses têm cenário fiscal de produção e **pagam IPI**. Outros itens são **revenda**, e o IPI depende do caso. Por isso, todo orçamento FixDoor confere o IPI de cada item com a **TIPI oficial**.

## Quando

1. **Na prévia**, antes de criar o orçamento: para mostrar o IPI esperado de cada item.
2. **Depois de criar** o orçamento no Omie: para comparar com o IPI que o Omie realmente calculou.

## Como (econômico: uma chamada só)

1. Pegue o **NCM** de cada item:
   - itens da tabela: `omie_executar` `geral/produtos:ConsultarProduto` com o `codigo_produto`, campo `ncm`;
   - depois de criar o pedido: `det[].produto.ncm` do `ConsultarPedido`.
2. Chame `consultar_tipi` **uma vez** com **todos** os NCMs do orçamento. Não chame item por item e nunca tente ler a TIPI inteira.
3. Depois de criar o pedido, leia de cada item em `ConsultarPedido`:
   - `det[].imposto.ipi.cod_sit_trib_ipi`
   - `det[].imposto.ipi.aliq_ipi`
   - `det[].imposto.ipi.valor_ipi`

## Como julgar

Situação tributária do IPI no Omie (CST), as mais comuns:
- **50**: tributada;
- **51**: alíquota zero;
- **52**: isenta;
- **53**: não tributada;
- **54**: imune;
- **55**: suspensão;
- **99**: outras.

| Situação | Status |
|---|---|
| Omie tributa (CST 50) com a **mesma alíquota** da TIPI | ✅ |
| Omie tributa com alíquota **diferente** da TIPI | ⚠️ conferir o cadastro do produto ou a exceção tarifária |
| TIPI tem alíquota > 0 e o Omie **não tributa** (51/52/53...) | ⚠️ "Item de produção? O Omie está tratando como revenda/sem IPI." |
| TIPI "NT" ou 0% e o Omie tributa | ⚠️ conferir |
| Item de **revenda** (cenário de revenda) sem IPI e TIPI > 0 | ℹ️ normal na revenda de mercadoria comprada pronta; só informe |
| NCM **não encontrado** na TIPI | ⚠️ NCM do cadastro pode estar errado ou desatualizado |
| NCM com **exceções (ex)** na TIPI | mostre as opções e pergunte qual se aplica, se o Omie não indicar |

**Não altere** cadastro de produto, cenário fiscal nem alíquota no Omie por conta própria: só aponte o que precisa ser conferido.

## Como mostrar (na prévia e no fechamento)

| # | Item | NCM | TIPI | Omie (CST · alíquota) | |
|---|---|---|---|---|---|
| 1 | Sensor fotocélula | 8543.70.99 | 0% | 53 · 0% | ✅ |
| 2 | Placa de comando | 8538.90.10 | 5% | 53 · 0% | ⚠️ produção? |

Informe abaixo da tabela a **vigência da TIPI** usada (vem no campo `vigencia` da consulta).

Lembretes:
- O IPI **não entra no valor do card** do RD (veja `valor-do-card.md`).
- Se `consultar_tipi` responder que a tabela não foi carregada, avise uma vez e siga o orçamento sem a conferência.
