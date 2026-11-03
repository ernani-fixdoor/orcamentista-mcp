# Resumo do card: formato visual

O resumo serve para a pessoa **entender o pedido rápido e corrigir o que for preciso** antes de qualquer orçamento. Por isso, cada informação aparece **separada pela origem**:
- o que já está nos **campos** do card;
- o que veio das **anotações**;
- o que veio de **cada anexo**;
- o que **você concluiu** a partir disso.

Use exatamente as seções abaixo, nesta ordem, com tabelas curtas. Escreva frases curtas e não repita a mesma informação em duas seções.

Legenda de status, usada em todas as tabelas:
- ✅ ok;
- ⚠️ conferir (divergência ou dúvida);
- ❌ falta.

---

## Modelo

```markdown
# 📋 <NOME DO CARD>
<Etapa> · Responsável no RD: <nome> · Orçamento por: **<FIXDOOR | MAXDOCK | FIXDOOR + MAXDOCK>**

## 🏢 Cliente
| | |
|---|---|
| Razão social | <razão social> |
| CNPJ | <cnpj> · Receita: <ATIVA / situação> |
| Cidade / UF | <cidade>/<UF> |
| Contribuinte ICMS | <SIM, IE 123… / NÃO> |
| Destinação | <Ativo imobilizado / Uso e consumo / Revenda / Serviço> |
| ICMS previsto | <12%> (<motivo em 3–6 palavras>) |

## 👤 Vendedor e representante
| | Quem | De onde veio |
|---|---|---|
| Vendedor | **<Renata / Tom / Ana / outro>** | <campo CONTATO COMERCIAL / anotação de 30/10 / regra regional (UF)> |
| Representante | <nome ou —> | <onde apareceu> |

## 🛠️ O que vai ser orçado
| # | Item / serviço | Qtd | Detalhes (medidas, modelo, cor…) | Fonte |
|---|---|---|---|---|
| 1 | Conjunto de mola | 2 | Porta seccional VL 2.450 × 2.810 | campo ITENS + anotação 30/10 |
| 2 | … | | | |

> Escopo em uma frase: <ex.: "peças de reposição para 2 portas seccionais, sem instalação">.

## 🚚 Frete · 👷 Mão de obra · 🏗️ Locação
| | Situação | Cotação |
|---|---|---|
| Frete | FOB, retirada em Pinhais | não precisa ✅ |
| Mão de obra | Não (campo = "X") | — |
| Locação PTA/MUNC | Não pedida | — |

## 🗒️ Descoberto nas anotações
<!-- uma linha por anotação que acrescente algo; ignore as que só repetem os campos -->
- **30/10 · Yasmin** — medidas das portas (2.450 × 2.810) e vendedor TOM.
- **31/10 · Ana** — ⚠️ pede "incluir mão francesa", que não está em ITENS DA SOLICITAÇÃO.

## ✅ Tarefas do card
- <tarefa> · <data> · <aberta/concluída>   (ou "Nenhuma tarefa.")

## 📎 Anexos
<!-- um bloco por arquivo do card (rd_listar_arquivos); se a lista vier vazia, escreva: "O card não tem arquivos." -->
<!-- ignore os arquivos que a própria skill anexou (Proposta..., Calculo da mola...) -->
<!-- se o documento de dados cadastrais do cliente (CNPJ, IE, e-mails, contato) trouxer algo diferente dos campos do card, leve para "Lacunas e conflitos" -->

### 📄 1. formulario_tecnico.pdf
- **O que é:** formulário de informações técnicas, preenchido pelo cliente
- **O que entendi:** 2 portas, vão 2.450 × 2.810, acionamento manual, sem visor
- **Muda o orçamento?** confirma os itens 1 e 2
- **Dúvidas:** ⚠️ a cor do painel não está informada

### 🖼️ 2. foto_porta_esquerda.jpg
- **O que mostra:** mola quebrada no eixo esquerdo; trilho em bom estado
- **Muda o orçamento?** não; reforça o item 1

## ⚠️ Lacunas e conflitos
| # | O quê | Onde | O que preciso de você |
|---|---|---|---|
| 1 | Mão francesa citada só na anotação | anotação 31/10 | Incluo no orçamento? |

---
**Confere?** Responda "ok" ou corrija o que estiver errado. Só depois disso eu sigo para os preços.
```

## Regras de preenchimento

- **"Fonte"** em "O que vai ser orçado" é obrigatória. Use: campo ITENS, anotação <data>, anexo <nº> ou "concluí". Quando a fonte for "concluí", marque ⚠️.
- **Anotações:** uma linha por anotação útil, com data e autor; resuma em até 15 palavras. Se uma anotação contradiz um campo, marque ⚠️ e leve o conflito para "Lacunas e conflitos".
- **Anexos:** **um bloco por arquivo**, numerado, mesmo que o arquivo não acrescente nada ("não muda o orçamento"). Para fotos, diga o que se vê. Para documentos, diga o que é e os dados que trouxe.
- **Lacunas e conflitos:** reúna aqui **tudo** que precisa de resposta, com pergunta direta. Se não houver nada, escreva "Nenhuma."
- **Tamanho:** o resumo deve caber numa tela. Se uma tabela passar de ~12 linhas, agrupe itens parecidos.
- Valores e preços **não** entram neste resumo. Eles vêm depois, na composição sugerida.

## Vendedor do orçamento

1. **O card manda.** Procure nesta ordem:
   - o campo `CONTATO COMERCIAL` (ANA, TOM, RENATA, YASMIN, LUCAS);
   - as anotações ("VENDEDOR: TOM", "vendedor Renata"...);
   - a descrição dos itens.

   Se aparecer **representante**, mostre o nome do vendedor **e** o do representante. O representante costuma estar nas anotações, no nome do card ou em `POR QUAL EQUIPE?`.
2. **Sem vendedor no card**, use a **regra regional pela UF de destino** (campo ESTADO da empresa; se `LOCAL DA OBRA` indicar outra UF, pergunte qual vale):

   | Região | UFs | Vendedor |
   |---|---|---|
   | Sul | PR, SC, RS | **Renata** |
   | Sudeste | SP, RJ, MG, ES | **Tom** |
   | Centro-Oeste | MT, MS, GO, DF | **Tom** |
   | Norte | AM, PA, AC, RO, RR, AP, TO | **Tom** |
   | Nordeste | MA, PI, CE, RN, PB, PE, AL, SE, BA | **Ana** |

3. Se o card indicar um vendedor diferente da regra regional, **siga o card** e só comente ("card indica Ana; pela região seria Tom").
4. **No Omie**, representante não é um campo separado. Cada representante é um **vendedor próprio**, cadastrado como o vendedor principal mais o nome do representante (ex.: "Tom" e "Tom + <representante>"). Na hora de lançar no Omie, o vendedor é:
   - o vendedor sozinho, quando não há representante;
   - o cadastro "vendedor + representante", quando há.
5. **Por enquanto, não preencha o vendedor no Omie.** Os códigos dos vendedores ainda não estão disponíveis, porque o usuário não tem acesso ao cadastro. Deixe `codVend`/`nCodVend` vazio e mostre na prévia uma linha "Vendedor no Omie: <nome> (preencher manualmente)". Quando houver regra aprendida com os códigos (categoria "omie"), passe a usá-la.
