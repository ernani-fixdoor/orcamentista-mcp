# Orçamentista: o que está no ar e o que falta

## Já feito (pelo Claude)

- **Supabase** (`fixdoor-sistemas`):
  - schema separado `orcamentista`, com as tabelas `orcamentos`, `aprendizados` e `config`;
  - funções protegidas `public.orc_*`. O conector não usa a service key e não precisa de "Exposed schemas".
- **Vercel**: projeto `orcamentista-fixdoor` publicado em https://orcamentista-fixdoor.vercel.app (região gru1). Variáveis já configuradas:
  - `MCP_CHAVE`
  - `ORC_DB_CHAVE`
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
- **Diagnóstico**: `https://orcamentista-fixdoor.vercel.app/<MCP_CHAVE>/saude` mostra se o Supabase, o RD e a consulta de CNPJ estão respondendo.

## Falta (só você consegue fazer)

### 1. Token do RD Station
1. No RD Station CRM: seu nome › **Perfil**/**Configurações da conta** › **Token da instância** (ou Integrações). Copie.
2. Na Vercel: projeto **orcamentista-fixdoor** › Settings › **Environment Variables** › Add:
   - nome `RD_CRM_TOKEN`
   - tipo **Sensitive**
   - ambientes Production e Preview
3. Avise o Claude. Ele publica de novo e mapeia os campos e as etapas do RD.

### 2. Repositório no GitHub
O Claude não consegue criar repositórios. Em https://github.com/new, crie `ernani-fixdoor/orcamentista-mcp`:
- **Private**
- **sem** README

Depois avise o Claude, que envia o código.

### 3. claude.ai: conector e skill
- **Conector**: Settings › Connectors › **Add custom connector**:
  - nome: Orçamentista FixDoor
  - URL: `https://orcamentista-fixdoor.vercel.app/<MCP_CHAVE>/mcp`

  Para o time, um owner adiciona em Organization settings › Connectors. Confirme que o conector **Omie** também está ativo.
- **Skill**: Settings › Capabilities › Skills › **Upload skill** › `orcamentista-fixdoor.skill`.

### 4. Primeiros testes (numa conversa nova no claude.ai)
1. "Use o Orçamentista para listar os funis e os campos personalizados do RD."
2. "Faça o resumo do card do cliente X, sem criar nada."
3. Um orçamento simples de peças até a aprovação.
4. Um orçamento CIF sem cotação de frete: confira a tarefa criada no RD.
5. Um equipamento novo com mão de obra terceirizada.

## Segurança
- A URL do conector contém a `MCP_CHAVE`: trate como senha.
- Para trocar a chave, gere uma nova, atualize `MCP_CHAVE` na Vercel e publique de novo.
- A `ORC_DB_CHAVE` só serve para as funções `orc_*`. Para trocá-la, veja o README.
