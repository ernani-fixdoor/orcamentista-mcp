# Textos padrão das observações

Use o texto da empresa em que o orçamento está sendo criado: FixDoor no pedido de venda e MaxDock na OS. No Omie, cada quebra de linha vira `|`.

Como preencher:
- **Opções alternativas**: mantenha **só a que se aplica** e apague as outras. São elas:
  - as linhas de FRETE;
  - INSTALAÇÃO caso sim / caso não;
  - Portas x Peças e Partes no prazo de produção e no prazo de pagamento.
- **Campos em branco** (ex.: "Peças e Partes: __ dias", "PRAZO DE PAGAMENTO:") **têm que ser preenchidos**. Use o padrão das regras aprendidas. Se não houver padrão, pergunte. Nunca envie em branco sem avisar.
- **Padrões já definidos** (regras confirmadas do Ernani):
  - prazo de produção de **molas**: `Peças e Partes: 10 dias;`;
  - prazo de pagamento de peças e partes: **15 dias** para cliente que já comprou na FixDoor e **à vista** para cliente que nunca comprou (`Peças e Partes: à vista;`); na MaxDock, 15 dias. Confira se o cliente já comprou procurando-o no Omie (`geral/clientes:ListarClientes` pelo CNPJ) e nos pedidos dele. Para à vista, veja "Pagamento à vista" em `omie-fixdoor.md`.
- Pendências entram no próprio texto. Exemplo: "FRETE: CIF - com descarga (valor em cotação)".
- Não altere o restante do texto. As cláusulas são jurídicas.

---

## FixDoor

```
PRAZO DE PRODUÇÃO:
Portas: 50 dias após envio de Formulário de Informações Técnicas preenchido/assinado, Pedido de compra ou contrato assinado e pagamento de sinal quando houver;
Peças e Partes:  dias;

FRETE: 
FOB- Por conta do cliente - retirar em Pinhais / PR
FOB - Indicação para faturamento direto entre transportadora e Cliente

CIF - sem descarga
CIF - com descarga pela transportadora

PRAZO DE PAGAMENTO: 
Portas: 80% de sinal, saldo para 15 dias DDF;
Peças e Partes: 15 dias;

INSTALAÇÃO:
CASO NÃO:
Não inclusa, caso tenha prestação de serviço estará em proposta separada.

CASO SIM:
Instalação efetuada por equipe terceira credenciada e treinada pela FixDoor.
Cliente deve fornecer PTA para executarmos as atividades.
Não incluso movimentação horizontal.

PRAZO DE VALIDADE DA PROPOSTA:
15 dias a partir da data de envio ao cliente.
_____________

FORMA DE PAGAMENTO: Boleto bancário;

GARANTIA: Peças e Partes: 12  meses após emissão de Nota Fiscal;

COBERTURA DA GARANTIA
- Qualquer defeito de fabricação será reparado pela FixDoor, desde que obedeça o prazo de garantia.
- As peças ou equipamentos com defeito de fabricação serão reparados pela FixDoor. Caso não seja possível reparar o equipamento, as peças serão substituídas.
- A garantia é limitada à prestação de serviços e ao fornecimento de materiais necessários para correção dos defeitos de fabricação.

EXCLUSÕES DA GARANTIA
- Danos causados nas peças por desgaste natural, choque mecânico, ausência de manutenção preventiva (inclusive lubrificação de partes móveis), alterações no produto sem autorização da fábrica, imprudência ou imperícia da equipe técnica contratada ou própria do Cliente, alterações em parâmetros ou regulagens raios ou curtos-circuitos. 
- Danos causados por umidade, chuva, fogo, quedas de material ou choques mecânicos. 
- Instalação não executada por equipe credenciada FixDoor para danos causados por erro de instalação.
 
POLÍTICA DE CANCELAMENTO
- Em caso de cancelamento após envio da O.C. pelo Cliente, será cobrada multa de 20% sobre o valor total do pedido.

CLIENTE
- Caso a proposta contemple instalação ou manutenção por equipe credenciada, o Cliente deve fornecer plataforma elevatória para execução dos serviços.
- Qualquer alteração ou adequação civil é de responsabilidade do Cliente.
- Na proposta não está inclusa ART de produto, ART de instalação e técnico de segurança do trabalho. Caso necessário, deverá ser negociado entre as partes.

DEMAIS INFORMAÇÕES:
- Os valores apresentados neste orçamento foram calculados com base nas quantidades inicialmente solicitadas. Qualquer alteração, fracionamento ou ajuste nesses quantitativos poderá resultar na revisão dos valores informados.
- A responsabilidade pela descarga das mercadorias será do cliente, salvo quando houver indicação contrária no descritivo acima.
- Cabe ao cliente garantir que os produtos sejam mantidos em local apropriado, protegido contra condições climáticas adversas. Danos ocasionados por armazenamento inadequado não serão contemplados pela garantia.
- Na ausência de indicação no orçamento sobre execução da montagem em feriados ou finais de semana, os serviços serão realizados de forma contínua, em dias úteis e dentro do horário comercial.
- Caso não esteja descrito no orçamento, documentos exclusivos para obra como, por exemplo, ART, PGR, PCMSO serão cobrados a parte;
- Caso não esteja descrito no orçamento, desmontagem de portas e equipamentos existentes são de responsabilidade do Cliente. 

DOS AJUSTES DA REFORMA TRIBUTÁRIA:
- IBS e CBS. Para todos os fins, as Partes reconhecem que os valores da prestação de serviços e venda de produtos previstos neste pedido constituem valores líquidos e não incluem quaisquer tributos incidentes sobre a operação que venham a ser exigidos em razão da Reforma Tributária, incluindo o IBS e a CBS.
- Caso haja incidência de IBS e/ou CBS (ou de quaisquer tributos que os venham a substituir com a mesma materialidade) sobre os valores devidos no âmbito deste pedido, tais tributos serão cobrados destacadamente, em adição aos valores líquidos pactuados, mediante emissão e entrega, pela FixDoor, da documentação hábil e idônea exigida pela legislação aplicável.
- O Cliente obriga-se a pagar os valores destacados a título de IBS/CBS nos mesmos prazos e condições aplicáveis aos valores previstos neste Contrato.
```

Escolhas da FixDoor:
- **FRETE**:
  - FOB: "FOB- Por conta do cliente - retirar em Pinhais / PR". Use "FOB - Indicação para faturamento direto..." só se o card indicar isso.
  - CIF: "CIF - sem descarga" ou "CIF - com descarga pela transportadora", conforme o card.
- **INSTALAÇÃO**:
  - Sem mão de obra: o bloco "CASO NÃO".
  - Com mão de obra no orçamento FixDoor (equipamento novo): o bloco "CASO SIM".
  - Com mão de obra na MaxDock (peças + serviço): "CASO NÃO", porque o serviço está em proposta separada.
- **Locação**: se a PTA/MUNC for fornecida pela FixDoor/MaxDock (cotada), troque "Cliente deve fornecer PTA..." pelo que foi orçado.

---

## MaxDock

```
PRAZO DE PAGAMENTO: 

INSTALAÇÃO: Equipe formada por até 2 técnicos, treinada e capacitada para a atividade.

Cliente deve fornecer PTA para executarmos as atividades.
Não incluso movimentação horizontal.

PRAZO DE VALIDADE DA PROPOSTA:
15 dias a partir da data de envio ao cliente.
_____________

FORMA DE PAGAMENTO: Boleto bancário;

GARANTIA: Serviço: 3 meses;

COBERTURA DA GARANTIA
A garantia é limitada à prestação de serviços e ao fornecimento de materiais necessários para correção dos defeitos de instalação.

EXCLUSÕES DA GARANTIA
Danos causados nas peças por desgaste natural, choque mecânico, ausência de manutenção preventiva (inclusive lubrificação de partes móveis), alterações no produto sem autorização da fábrica, imprudência ou imperícia da equipe técnica contratada ou própria do Cliente, alterações em parâmetros ou regulagens raios ou curtos-circuitos. 
Danos causados por umidade, chuva, fogo, quedas de material ou choques mecânicos. 

 
POLÍTICA DE CANCELAMENTO
Em caso de cancelamento após envio da O.C. pelo Cliente, será cobrada multa de 20% sobre o valor total do pedido.


CLIENTE
Cliente deve fornecer plataforma elevatória para execução dos serviços.
Qualquer alteração ou adequação civil é de responsabilidade do Cliente.
Na proposta não está inclusa ART de produto, ART de instalação e técnico de segurança do trabalho. Caso necessário, deverá ser negociado entre as partes.
Não inclusos documentos específicos para a obra.
```

Na MaxDock:
- **PRAZO DE PAGAMENTO** precisa ser preenchido. Uma OS antiga usou "40% de sinal, saldo 15 dias após conclusão da instalação pela equipe Max Dock", mas não é padrão confirmado: pergunte.
- Se a MaxDock fornecer a PTA (locação cotada), ajuste as duas frases sobre PTA/plataforma elevatória.
