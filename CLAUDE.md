# Orçamentista FixDoor

Conector MCP (Next.js 16 + mcp-handler) usado pela skill `orcamentista-fixdoor` (pasta `skill/`). Detalhes em `README.md` e `PASSO-A-PASSO.md`.

- Produção: Vercel, projeto `orcamentista-fixdoor` (equipe ldobuchak's projects, região gru1), https://orcamentista-fixdoor.vercel.app. A Vercel **não** está ligada ao GitHub: publique enviando os arquivos (API/MCP da Vercel ou `npx vercel --prod`), sem dados do git.
- Variáveis na Vercel: `MCP_CHAVE`, `RD_CRM_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ORC_DB_CHAVE` (lista em `.env.example`).
- Supabase `fixdoor-sistemas`: schema `orcamentista` (orcamentos, aprendizados, config) e funções `public.orc_*` protegidas pela `ORC_DB_CHAVE`. O conector não usa a service key. A tabela de preços (`precos_*`) é só leitura aqui.
- Regras de ICMS em `src/lib/icms.ts`, copiadas do repositório `tabela-precos-fixdoor`: mantenha as duas iguais. Teste com `npm test`.
- RD Station API v1: campos fiscais (CNPJ, ESTADO, IE, contribuinte) ficam na empresa do card. A API não expõe anexos.
- Ao mudar a skill, reempacote (`skill/orcamentista-fixdoor.skill`) e reenvie ao claude.ai.
- Diagnóstico: `GET /<MCP_CHAVE>/saude`.
