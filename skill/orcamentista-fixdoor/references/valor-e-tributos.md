# Valor do card (produtos do RD) e tributos no PDF

## 1. Valor da negociação no RD

O valor do card é **a soma dos produtos lançados nele**. O RD calcula esse total sozinho. A equipe lança **uma linha por categoria**, com quantidade 1 e o total daquela categoria. Exemplo real (SIGMA WOOD):
- "Peças e Partes - Porta Seccional" R$ 1.015,13
- "Serviços - MaxDock" R$ 2.700,00
- total do card R$ 3.715,13

**Quando:** sempre que um orçamento for **criado** e sempre que for **revisado ou atualizado** no Omie.

**Ferramenta:** `rd_definir_valor_produtos` com a lista completa do card, somando FixDoor e MaxDock.
- Na criação, use `remover_outros: true`.
- Na revisão, mostre as linhas atuais (`rd_listar_produtos_negocio`) e as novas. Com o ok da pessoa, use `remover_outros: true`.

### O que entra no valor

Entra **só o valor do produto ou serviço em si**. Pegue do orçamento **gravado no Omie**, e não da prévia:
- FixDoor (`ConsultarPedido`): para cada item, `det[].produto.valor_mercadoria` − `valor_desconto`.
- MaxDock (`ConsultarOS`): para cada serviço, `nQtde × nValUnit` − `nValorDesconto`.

**Não entram:**
- **IPI**;
- **ICMS-ST**;
- **frete**, tanto `frete.valor_frete` quanto qualquer item de frete;
- itens de **locação** (PTA, MUNC, plataforma, empilhadeira...);
- o total do pedido (`valor_total_pedido`), porque ele já soma IPI, ST e frete.

O ICMS próprio faz parte do preço (é calculado "por dentro"), então ele **fica** no valor.

### Categoria de cada item (catálogo de produtos do RD)

| Item | Produto no RD |
|---|---|
| Peças de porta seccional (tabela, linha "Seccional") | Peças e Partes - Porta Seccional |
| Porta seccional nova | Portas Seccionais - Equip. Novos |
| Peças de porta rápida (linha "Rápidas") | Peças e Partes - Portas Rápidas |
| Portal/abrigo de selamento novo | Portal de Selamento - Equip. Novos |
| Peças de portal/abrigo de selamento | Peças e Partes - Portal de Selamento |
| Nivelador de doca novo | Nivelador de Doca - Equip. Novos |
| Peças de nivelador | Peças e Partes - Nivelador de Doca |
| Porta corta-fogo | Porta corta fogo |
| Bollards / dock safety | Acessórios Segurança (Bollards / Dock Safety) |
| Serviço da MaxDock (OS) | Serviços - MaxDock |
| O que não se encaixa | Outros (pergunte antes) |

- **Acessórios elétricos** (motor, central, botoeira...) vão para a categoria da porta a que pertencem. Se não der para saber, pergunte.
- **Mão de obra dentro do orçamento FixDoor** (equipamento novo com instalação terceirizada): **pergunte na primeira vez** se entra na categoria do equipamento ou em "Serviços - MaxDock". Registre a resposta como aprendizado (categoria "rd").

Mostre a divisão por categoria na prévia, com o total do card, antes de gravar.

## 2. Tributos no PDF do Omie

O PDF da proposta (`ObterPedVenda`) sai **no layout configurado no Omie**. A API não tem opção para mostrar ou esconder colunas de imposto. O que aparece com certeza no PDF são as **observações do pedido** (`obs_venda`). Por isso os tributos vão num bloco de texto, logo no início das observações:

```
TRIBUTOS INCLUSOS:
ICMS: 12,00%
PIS: 1,65%
COFINS: 7,60%
```

Regras:
- **ICMS, PIS e COFINS sempre aparecem**, em todo orçamento de produto da FixDoor.
- **IPI** e **ICMS-ST** só entram **se algum item tiver valor** desses impostos, em linhas separadas e fora do "inclusos":
  ```
  IPI: 5,00% (R$ 123,45, destacado à parte)
  ICMS-ST: R$ 234,56 (destacado à parte)
  ```
- Os percentuais vêm **do próprio Omie**, nunca de memória:
  - de preferência, rode `produtos/pedido:SimularImpostos` com o mesmo conteúdo do pedido antes de incluir, para o bloco já entrar na criação;
  - se não der, inclua o pedido, leia `ConsultarPedido` (`det[].imposto`: `icms.aliq_icms`, `pis_padrao.aliq_pis`, `cofins_padrao.aliq_cofins`, `ipi.aliq_ipi`/`valor_ipi`, `icms_st.valor_icms_st`) e atualize `obs_venda` com `AlterarPedidoVenda`.
- Se os itens tiverem alíquotas diferentes (por exemplo, um importado a 4% e um nacional a 12%), mostre cada uma com os itens a que se refere.
- Cliente **não contribuinte** (a FixDoor paga o DIFAL): acrescente "DIFAL incluso" na linha do ICMS.
- Depois de ajustar as observações, gere o PDF de novo (`ObterPedVenda`) antes de anexar ao card.

Se a equipe quiser colunas de imposto na tabela de itens do PDF, isso se configura **no Omie**, nas opções de impressão do pedido. A skill não consegue mudar.
