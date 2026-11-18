# Valor do card (produtos do RD)

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
- **mão de obra terceirizada** (equipe que não é a MaxDock);
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
- **Mão de obra:**
  - feita pela **MaxDock** (OS da MaxDock) → entra em "Serviços - MaxDock";
  - **terceirizada** (qualquer equipe que não seja a MaxDock), mesmo lançada dentro do orçamento FixDoor → **não entra no valor do card**. Ela continua no orçamento do Omie, mas fica fora da soma.

Mostre a divisão por categoria na prévia, com o total do card, antes de gravar.
