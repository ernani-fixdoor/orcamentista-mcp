# ICMS: como o preço é calculado

O cálculo é feito pelo conector (`calcular_precos` e `aplicar_icms`), com as mesmas regras da tabela de preços e do consultor de ICMS/DIFAL da FixDoor. Este arquivo serve para explicar e conferir. **Não recalcule à mão no lugar do conector.**

Por enquanto vale só o **cliente final** (CMV da tabela, chave `cmv`). Não use preço de montador nem de fabricante.

```
preço líquido (sem ICMS) = custo × peso ÷ CMV
preço com ICMS           = preço líquido ÷ (1 − alíquota que a FixDoor suporta)    ("por dentro")
```

## Alíquota embutida no preço (venda saindo do PR)

| Situação | Alíquota | DIFAL |
|---|---|---|
| Destino PR (operação interna) | interna do PR: **19,5%**, mesmo para importado | não há |
| Fora do PR · contribuinte (IE) · ativo ou uso e consumo | interestadual: **12%** para MG, RJ, SP, RS e SC; **7%** para os demais | o cliente recolhe |
| Fora do PR · contribuinte · **revenda** | interestadual | não há |
| Fora do PR · **não contribuinte** (sem IE) | **interna do estado de destino** (a carga inteira) | a FixDoor recolhe (GNRE) |
| Produto **importado** (origem 1, 2, 3 ou 8; conteúdo importado > 40%), fora do PR | interestadual de **4%** (contribuinte) | conforme a linha acima |

- O **Simples Nacional** do cliente não muda a alíquota. Muda a observação: o cliente recolhe o DIFAL pelo Simples e não tem CIAP.
- A **origem** vem da tabela (campo `origem`, lido do Omie). Se estiver vazia, o conector calcula como nacional e mostra o valor alternativo para importado. Confira a origem no cadastro do produto no Omie (`geral/produtos:ConsultarProduto`) e recalcule com `importado: true/false`.
- O Omie já está configurado para a alíquota de 4% dos importados na nota fiscal. O que a skill controla é o **preço**: o ICMS embutido tem que bater com o cenário.

Alíquotas internas: AC 19 · AL 20 · AM 20 · AP 18 · BA 20,5 · CE 20 · DF 20 · ES 17 · GO 19 · MA 22 · MG 18 · MS 17 · MT 17 · PA 19 · PB 20 · PE 20,5 · PI 21 · PR 19,5 · RJ 22 · RN 18 · RO 19,5 · RR 20 · RS 17 · SC 17 · SE 20 · SP 18 · TO 20.
