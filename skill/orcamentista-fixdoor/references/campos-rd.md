# Onde está cada informação no card do RD Station

> **A preencher no primeiro teste com o token real.** Rode `rd_listar_campos` e `rd_listar_funis` e um `rd_ler_negocio` de um card real, e complete esta tabela com os rótulos exatos e os ids. Até lá, procure pelos rótulos abaixo nos `campos_personalizados` do card (comparação aproximada, sem acento e sem maiúsculas) e confirme com a pessoa.

| Informação | Rótulo esperado no card | id do campo | Valores possíveis / como interpretar |
|---|---|---|---|
| Cliente | nome do negócio / empresa | — | o nome do card é o nome do cliente |
| CNPJ | "CNPJ" | ? | |
| Destino fiscal (UF) | "Destino fiscal" | ? | UF para onde vai a mercadoria (define o ICMS) |
| Contribuinte / IE | "Inscrição Estadual" / "Contribuinte" | ? | tem IE → contribuinte |
| Destinação | "Destinação" | ? | ativo imobilizado · uso e consumo · revenda |
| Simples Nacional | (se houver) | ? | conferir também com `consultar_cnpj` |
| Item solicitado | "Item solicitado" | ? | vira os itens/serviços do orçamento |
| Mão de obra | "Mão de obra" | ? | "X" ou "não" = sem mão de obra |
| Equipe de montagem | "Equipe de montagem" | ? | MaxDock · nome da terceirizada |
| Frete | "Frete" | ? | FOB · CIF (com/sem descarga) · nenhum |
| Observações | "Observações" | ? | pedidos de locação (PTA, MUNC) e detalhes |

## Etapas do funil

| Etapa | id |
|---|---|
| Solicitação de orçamento (entrada) | ? |
| **Aprovação** (destino ao concluir) | ? |

## Campos que a skill preenche no card (se existirem)

| Campo | id | Valor |
|---|---|---|
| Nº orçamento Omie FixDoor | ? | `numero_pedido` |
| Nº OS MaxDock | ? | `cNumOS` |
| Valor do orçamento | ? | total |
