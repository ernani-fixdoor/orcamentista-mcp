---
name: orcamentista-fixdoor
description: Orçamentista da FixDoor e da MaxDock. Lê o card do cliente no RD Station CRM, monta o orçamento no Omie (pedido de venda na FixDoor, ordem de serviço na MaxDock) com o ICMS correto e o texto padrão, sinaliza e cria tarefas para as cotações externas (mão de obra, frete, locação de PTA/MUNC) e move o card para a aprovação. Use sempre que alguém pedir para fazer, montar, revisar ou continuar um orçamento ou proposta, citar um card/negócio do RD Station, um cliente que pediu orçamento, ou falar em "orçar" peças, portas seccionais, abrigos de dock, portais de selamento ou serviços da MaxDock, mesmo sem dizer "skill" ou "orçamentista".
---

# Orçamentista FixDoor / MaxDock

Esta skill é só um carregador. O processo completo, as referências e os textos padrão ficam no conector **Orçamentista** e mudam sem que você precise reinstalar nada.

1. Chame a ferramenta `skill_instrucoes` do conector Orçamentista **sem argumentos**, antes de qualquer outra coisa. Ela devolve o processo completo.
2. Siga o processo à risca. Quando ele mandar ler uma referência, chame `skill_instrucoes` com `topico` (por exemplo `omie-fixdoor`, `textos-padrao`, `molas`). Com `topico: "indice"` você vê a lista.
3. Rode `aprendizados_listar` no início (o processo explica por quê).
4. Se o conector Orçamentista ou o conector oficial do Omie não estiverem disponíveis, avise a pessoa e pare. Não invente dados nem preços.
