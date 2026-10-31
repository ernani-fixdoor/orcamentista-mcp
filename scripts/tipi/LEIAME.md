# Atualizar a TIPI

A tabela `orcamentista.tipi` vem da planilha oficial da Receita. Atualize sempre que sair decreto ou ADE novo.

```bash
pip install openpyxl
curl -sL -o tipi.xlsx "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/documentos-e-arquivos/tipi.xlsx"
python3 scripts/tipi/parse.py tipi.xlsx tipi.json
python3 scripts/tipi/carregar.py tipi.json caminho/do/arquivo_com_ORC_DB_CHAVE.txt
```

- `parse.py` lê a aba "Tabela Completa" e gera uma linha por NCM de 8 dígitos, incluindo as exceções (Ex).
  - Alíquota "NT" vira `nt=true`.
  - A descrição leva os dois níveis pais, para dar contexto.
- `carregar.py` envia em lotes de 1.000 para `orc_tipi_carregar`, que faz upsert por (ncm, ex).
  - Antes de rodar, ajuste a vigência dentro do script.

Carga de 31/10/2026: 11.108 linhas (587 com Ex, 832 NT), TIPI 2022 atualizada até o ADE RFB nº 1/2026.
