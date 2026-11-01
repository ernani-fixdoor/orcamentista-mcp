# Molas de torção (porta seccional)

Sempre que o pedido envolver **mola** (troca, conjunto de molas, mola quebrada, porta nova que precisa de molas), o preço vem da **calculadora oficial da DOCO** e da regra de preço por kg. **Não use o preço da tabela** para molas.

## Regra de preço

```
valor por mola SEM ICMS = peso da mola (kg) × R$ 180
valor por mola COM ICMS = aplicar_icms(valor sem ICMS, cenário do cliente)
```

Some o valor sem ICMS das molas do conjunto e aplique o ICMS com `aplicar_icms`. Use o cenário do cliente (UF, contribuinte, destinação) e `importado` conforme a origem do produto de mola no Omie.

## Como calcular: ferramenta `calcular_mola`

**Modo 1: pelos dados da porta.** O conector abre a calculadora da DOCO, preenche os campos e devolve as opções de mola. A chamada leva de 10 a 20 segundos.

| Campo da DOCO | Parâmetro | De onde vem | Padrão |
|---|---|---|---|
| W (largura do vão) | `largura_mm` | card, anotações ou anexo | — (obrigatório) |
| H (altura do vão) | `altura_mm` | card, anotações ou anexo | — (obrigatório) |
| DW (peso total da porta) | `peso_porta_kg` | anexo ou informado pela pessoa | — (obrigatório: **pergunte se não houver**) |
| BS (peso do painel inferior) | `peso_painel_inferior_kg` | idem | — (obrigatório: **pergunte se não houver**) |
| Door type | `tipo_porta` | tipo de levantamento | Standard |
| Nr of Springs | `numero_molas` | pedido ("2 molas", "conjunto") | 2 |
| Cycles | `ciclos` | pedido do cliente | 25000 |
| Spring Choice | `acabamento` | Normal, Galvanized ou Shot Blasted | Normal |
| Cabledrums | `tambor` | tambor de cabo da porta | o da calculadora |
| Lift / Pitch | `lift_mm` / `pitch` | só para High-Lift ou com inclinação | — |

- **Nunca invente o peso da porta.** Se o card não trouxer, pergunte o peso total e o do painel inferior, ou como estimar (ex.: kg/m² do painel usado).
- A **opção 1** da resposta é a recomendada pela DOCO. Mostre também as alternativas, se houver.
- Se a resposta trouxer `avisos` (campo não encontrado, valor que não "pegou"), mostre-os e **não use o resultado** sem conferir.

**Modo 2: molas já especificadas.** Quando o card ou a pessoa já informam diâmetro interno, fio e comprimento (ex.: troca de molas com as medidas da mola antiga), envie `molas: [{diametro_interno_mm, fio_mm, comprimento_mm, quantidade}]`. O peso é calculado pela fórmula do aço, que confere com a DOCO; não é preciso abrir a calculadora.

## Como mostrar

Mostre os dados usados na calculadora e depois as molas:

| Mola | DI (mm) | Fio (mm) | Comprimento (mm) | Voltas | Ciclos | Peso (kg) | Sem ICMS | Com ICMS |
|---|---|---|---|---|---|---|---|---|
| 1 | 152,4 | 9,0 | 1.117 | 11,99 | 35 mil | 31,43 | R$ 5.657,40 | … |
| 2 | 152,4 | 9,0 | 1.117 | 11,99 | 35 mil | 31,43 | R$ 5.657,40 | … |
| **Total** | | | | | | **62,86** | **R$ 11.314,80** | **…** |

Fonte: calculadora DOCO (doco-international.com/en/support/spring_calculator) + R$ 180/kg.

## No Omie

- Lance cada mola como item, usando o **produto de mola cadastrado no Omie**, com o valor unitário **com ICMS**. Na descrição ou observação do item, informe DI × fio × comprimento e o acabamento.
- Se não souber qual produto do Omie usar para mola, pergunte e registre a resposta como aprendizado (categoria "itens").
- No valor do card do RD, a mola entra em "Peças e Partes - Porta Seccional" (ou na categoria da porta nova), pelo valor do item.
