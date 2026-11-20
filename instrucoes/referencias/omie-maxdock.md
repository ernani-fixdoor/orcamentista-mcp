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
| `Cabecalho.nCodVend` | a inclusão **não grava** o vendedor: deixe vazio e grave depois (veja a seção 3) | ver `resumo-card.md` |
| `Cabecalho.cEtapa` | `"00"` | orçamento (como a OS 1923) |
| `Cabecalho.dDtPrevisao` | hoje + 15 dias | DD/MM/AAAA |
| `Cabecalho.cCodParc` / `nQtdeParc` | conforme condição de pagamento | |
| `InformacoesAdicionais.cCodCateg` | `"1.01.99"` para instalação ou manutenção em porta rápida (OS 1945); `"1.01.98"` na OS 1923 | copie da OS recente do mesmo tipo |
| `InformacoesAdicionais.nCodCC` | `5223164741` (OS 1923) | copie da OS recente |
| `InformacoesAdicionais.cCidPrestServ` | cidade do serviço, ex.: `"PINHAIS (PR)"` | |
| `ServicosPrestados[].cDescServ` | descrição clara do serviço (o que e onde, quantas portas). **Nunca** inclua dias de serviço, número de técnicos nem pernoite: esses dados servem só para o cálculo e para a anotação do card | quebras de linha = `|` |
| `ServicosPrestados[].nCodServico` | código do serviço cadastrado, se houver | listar com `servicos/servico:ListarCadastroServico` |
| `ServicosPrestados[].nQtde` / `nValUnit` | valor informado pela pessoa ou calculado pela planilha de custo (veja `processo.md`, mão de obra) | |
| `ServicosPrestados[].cTribServ` | `"A4"` | igual nas OS vistas |
| `ServicosPrestados[].nCodServico` (ex.) | `5102342686` = `SRV00004` (manutenção em porta, OS 1923) | escolha o serviço cadastrado que corresponde ao pedido |
| `Cabecalho.cCodParc` (ex.) | `"A15"` = 15 dias | conforme `PRAZO DE PAGAMENTO` do card |
| `Observacoes.cObsOS` | texto padrão MaxDock preenchido | quebras de linha = `|` |

**Locação de PTA/MUNC** fornecida pela MaxDock entra como uma linha de serviço própria ("Locação de Plataforma Elevatória Articulada"), com o valor da cotação. Sem cotação → pendência e tarefa no RD.

Quando houver orçamento FixDoor ligado (peças + serviço), cite o número do pedido FixDoor na descrição da OS ("Referente ao pedido FixDoor nº X") e, se possível, a OS no texto do pedido FixDoor.

## 3. Depois de incluir

1. **Vendedor.** O usuário da API não acessa o cadastro de vendedores da MaxDock (`ListarVendedores` dá erro de permissão) e o `IncluirOS` ignora `nCodVend`. Rode `servicos/os:AlterarOS` com `{"Cabecalho": {"nCodOS": <nCodOS>, "nCodVend": <código>}}` (só essas duas tags, dentro de `Cabecalho`; numa tentativa com mais campos de identificação o Omie recusou). Código da **Renata na MaxDock: `5547276019`** (inferido das OS da NUTRIFRIOS; confirme o nome na tela da OS). Para outro vendedor, procure o `nCodVend` em OS recentes dele com `ListarOS` e confirme com a pessoa.
2. `servicos/os:ConsultarOS`: confira os valores e o vendedor; guarde `cNumOS`. Ele vai para o **título do card** (`rd_adicionar_numero_titulo`, empresa "maxdock" → 🟦). Para corrigir, use `servicos/os:AlterarOS`. Nunca inclua de novo.
