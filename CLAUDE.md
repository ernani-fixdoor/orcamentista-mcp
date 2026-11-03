# Orçamentista FixDoor

Conector MCP (Next.js 16 + mcp-handler) usado pela skill `orcamentista-fixdoor` (pasta `skill/`). Detalhes em `README.md` e `PASSO-A-PASSO.md`.

- Produção: Vercel, projeto `orcamentista-fixdoor` (equipe ldobuchak's projects, região gru1), https://orcamentista-fixdoor.vercel.app. A Vercel **não** está ligada ao GitHub: publique enviando os arquivos (API/MCP da Vercel ou `npx vercel --prod`), sem dados do git.
- Variáveis na Vercel: `MCP_CHAVE`, `RD_CRM_TOKEN`, `RD_CLIENT_ID`, `RD_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ORC_DB_CHAVE`, `OMIE_FIXDOOR_APP_KEY/SECRET`, `OMIE_MAXDOCK_APP_KEY/SECRET` (lista em `.env.example`).
- Anexos no Omie: `omie_anexar_arquivo` (`src/lib/omie.ts`, ZIP em `src/lib/zip.ts`) baixa uma URL https, compacta e chama `geral/anexo:IncluirAnexo`. O conector Omie oficial do Claude não envia arquivo local. `calcular_mola` devolve `pdf_calculo_url` (PDF do botão Print da DOCO) por opção, para anexar no RD e no Omie.
- Supabase `fixdoor-sistemas`: schema `orcamentista` (orcamentos, aprendizados, config) e funções `public.orc_*` protegidas pela `ORC_DB_CHAVE`. O conector não usa a service key. A tabela de preços (`precos_*`) é só leitura aqui.
- Regras de ICMS em `src/lib/icms.ts`, copiadas do repositório `tabela-precos-fixdoor`: mantenha as duas iguais. Teste com `npm test`.
- RD Station: v1 (token) para quase tudo; v2 (OAuth, `src/lib/rdv2.ts`, rota `/<chave>/rd-oauth`) só para anexos. Na v1, os campos fiscais (CNPJ, ESTADO, IE, contribuinte) ficam na empresa do card. A v1 não expõe anexos, mas a v2 sim: `rd_listar_arquivos`, `rd_baixar_arquivo` (ler), `rd_anexar_arquivo` e `rd_excluir_arquivo`.
- Ao mudar a skill, reempacote (`skill/orcamentista-fixdoor.skill`) e reenvie ao claude.ai.
- Diagnóstico: `GET /<MCP_CHAVE>/saude`.
