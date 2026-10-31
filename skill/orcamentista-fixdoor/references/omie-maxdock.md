# Omie MaxDock: orçamento de serviço = Ordem de Serviço na etapa "00" (orçamento)

`app_hash`: `maxdock-3uvozddw`. É uma OS avulsa, não um contrato recorrente. Rode `omie_descrever_operacao` em `servicos/os:IncluirOS` antes da primeira inclusão.

As OS de orçamento atuais (19xx, como a 1923 de 28/10/2026) ficam na **etapa "00"**. Antes de incluir, consulte a OS mais recente da MaxDock (`ListarOS` com `ordem_decrescente: "S"`) e use a mesma categoria, conta corrente e serviço. **Na primeira vez, mostre o que vai ser enviado e confirme com a pessoa.** Depois registre o que foi confirmado como aprendizado (categoria "omie").

## 1. Cliente

O mesmo cliente precisa existir **também no Omie da MaxDock**: os cadastros são separados. Procure pelo CNPJ (`geral/clientes:ListarClientes`). Se não existir, pergunte antes de cadastrar.

## 2. Inclusão: `servicos/os:IncluirOS`

| Campo | Valor usual | Observação |
|---|---|---|
| `Cabecalho.cCodIntOS` | `OS-RD-<deal_id>-<AAAAMMDDhhmm>` | obrigatório |
| `Cabecalho.nCodCli` | código do cliente na MaxDock | |
| `Cabecalho.nCodVend` | **por enquanto, vazio** (códigos ainda indisponíveis) | ver `resumo-card.md` |
| `Cabecalho.cEtapa` | `"00"` | orçamento (como a OS 1923) |
| `Cabecalho.dDtPrevisao` | hoje + 15 dias | DD/MM/AAAA |
| `Cabecalho.cCodParc` / `nQtdeParc` | conforme condição de pagamento | |
| `InformacoesAdicionais.cCodCateg` | `"1.01.98"` (OS 1923) | copie da OS recente |
| `InformacoesAdicionais.nCodCC` | `5223164741` (OS 1923) | copie da OS recente |
| `InformacoesAdicionais.cCidPrestServ` | cidade do serviço, ex.: `"PINHAIS (PR)"` | |
| `ServicosPrestados[].cDescServ` | descrição clara do serviço (o que, onde, quantas portas, equipe) | quebras de linha = `|` |
| `ServicosPrestados[].nCodServico` | código do serviço cadastrado, se houver | listar com `servicos/servico:ListarCadastroServico` |
| `ServicosPrestados[].nQtde` / `nValUnit` | valor **informado pela pessoa** (a skill não cota mão de obra) | |
| `ServicosPrestados[].cTribServ` | `"A4"` | igual nas OS vistas |
| `ServicosPrestados[].nCodServico` (ex.) | `5102342686` = `SRV00004` (manutenção em porta, OS 1923) | escolha o serviço cadastrado que corresponde ao pedido |
| `Cabecalho.cCodParc` (ex.) | `"A15"` = 15 dias | conforme `PRAZO DE PAGAMENTO` do card |
| `Observacoes.cObsOS` | texto padrão MaxDock preenchido | quebras de linha = `|` |

**Locação de PTA/MUNC** fornecida pela MaxDock entra como uma linha de serviço própria ("Locação de Plataforma Elevatória Articulada"), com o valor da cotação. Sem cotação → pendência e tarefa no RD.

Quando houver orçamento FixDoor ligado (peças + serviço), cite o número do pedido FixDoor na descrição ou observação da OS, e vice-versa.

## 3. Depois de incluir

`servicos/os:ConsultarOS`: confira os valores; guarde `cNumOS`. Ele vai para o **título do card** (`rd_adicionar_numero_titulo`, empresa "maxdock" → 🟦). Para corrigir, use `servicos/os:AlterarOS`. Nunca inclua de novo.
