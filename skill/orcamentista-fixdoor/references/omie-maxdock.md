# Omie MaxDock: orçamento de serviço = Ordem de Serviço na 1ª coluna (cEtapa "10")

`app_hash`: `maxdock-3uvozddw`. É uma OS avulsa, não um contrato recorrente. Rode `omie_descrever_operacao` em `servicos/os:IncluirOS` antes da primeira inclusão.

A MaxDock tem poucas OS em orçamento no Omie (a última é de 2023). **Na primeira vez, mostre o payload completo à pessoa e confirme categoria, conta corrente e serviço.** Depois registre o que for confirmado como aprendizado (categoria "omie").

## 1. Cliente

O mesmo cliente precisa existir **também no Omie da MaxDock**: os cadastros são separados. Procure pelo CNPJ (`geral/clientes:ListarClientes`). Se não existir, pergunte antes de cadastrar.

## 2. Inclusão: `servicos/os:IncluirOS`

| Campo | Valor usual | Observação |
|---|---|---|
| `Cabecalho.cCodIntOS` | `OS-RD-<deal_id>-<AAAAMMDDhhmm>` | obrigatório |
| `Cabecalho.nCodCli` | código do cliente na MaxDock | |
| `Cabecalho.cEtapa` | `"10"` | 1ª coluna = orçamento |
| `Cabecalho.dDtPrevisao` | hoje + 15 dias | DD/MM/AAAA |
| `Cabecalho.cCodParc` / `nQtdeParc` | conforme condição de pagamento | |
| `InformacoesAdicionais.cCodCateg` | `"1.01.02"` (visto na OS anterior) | confirmar |
| `InformacoesAdicionais.nCodCC` | `5097399690` (visto na OS anterior) | confirmar |
| `InformacoesAdicionais.cCidPrestServ` | cidade do serviço, ex.: `"PINHAIS (PR)"` | |
| `ServicosPrestados[].cDescServ` | descrição clara do serviço (o que, onde, quantas portas, equipe) | quebras de linha = `|` |
| `ServicosPrestados[].nCodServico` | código do serviço cadastrado, se houver | listar com `servicos/servico:ListarCadastroServico` |
| `ServicosPrestados[].nQtde` / `nValUnit` | valor **informado pela pessoa** (a skill não cota mão de obra) | |
| `ServicosPrestados[].cTribServ` | `"A4"` (visto na OS anterior) | confirmar |
| `Observacoes.cObsOS` | texto padrão MaxDock preenchido | quebras de linha = `|` |

**Locação de PTA/MUNC** fornecida pela MaxDock entra como uma linha de serviço própria ("Locação de Plataforma Elevatória Articulada"), com o valor da cotação. Sem cotação → pendência e tarefa no RD.

Quando houver orçamento FixDoor ligado (peças + serviço), cite o número do pedido FixDoor na descrição ou observação da OS, e vice-versa.

## 3. Depois de incluir

`servicos/os:ConsultarOS`: confira os valores; guarde `cNumOS`. Para corrigir, use `servicos/os:AlterarOS`. Nunca inclua de novo.
