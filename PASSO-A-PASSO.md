# Passo a passo: colocar o Orçamentista no ar

São 6 passos. Os passos 1 a 4 são feitos uma vez só. Tempo estimado: 20 a 30 minutos.

---

## 1. GitHub: criar o repositório (2 min)

1. Em https://github.com/new, com o dono **ernani-fixdoor**:
   - nome: `orcamentista-mcp`
   - **Private**
   - **sem** README, .gitignore ou licença (o repositório tem que nascer vazio)
2. Avise o Claude: "repositório criado". Ele envia o código (conector + skill) para lá.

## 2. Pegar os tokens (5 min)

**Token do RD Station CRM**
1. Entre no RD Station CRM com um usuário administrador.
2. Clique no seu nome (canto superior direito) › **Perfil** (ou **Configurações da conta**) › procure **Token da instância** / **Integrações**.
3. Copie o token. Ele dá acesso à conta inteira do CRM: guarde como senha e não cole em conversas nem planilhas.

**Chave do Supabase**: é a mesma da tabela de preços.
1. Vercel › projeto **tabela-precos-fixdoor** › Settings › Environment Variables.
2. Copie os valores de `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`.

**Chave secreta do conector (`MCP_CHAVE`)**: invente uma longa e aleatória, com no mínimo 16 caracteres; o ideal é 40 ou mais. Exemplos:
- no Mac ou Linux: `openssl rand -hex 24`
- ou um gerador de senhas, **só com letras e números** (sem símbolos, porque ela vai na URL).

## 3. Vercel: publicar o conector (5 min)

1. https://vercel.com/new › **Import** o repositório `ernani-fixdoor/orcamentista-mcp`, no mesmo time dos outros projetos.
2. Framework: **Next.js** (detecta sozinho). Não mexa no build.
3. Em **Environment Variables**, adicione as 4:

   | Nome | Valor |
   |---|---|
   | `MCP_CHAVE` | a chave que você inventou |
   | `RD_CRM_TOKEN` | token do RD |
   | `SUPABASE_URL` | copiado da tabela de preços |
   | `SUPABASE_SERVICE_KEY` | copiado da tabela de preços |

4. **Deploy.** Ao terminar, anote o domínio, por exemplo `orcamentista-mcp.vercel.app`.
5. A URL do conector é:
   ```
   https://orcamentista-mcp.vercel.app/<MCP_CHAVE>/mcp
   ```
   Quem tiver essa URL usa o conector. Trate como senha. Se vazar, troque a `MCP_CHAVE` na Vercel e faça redeploy.
6. Em Settings › **Deployment Protection**, a produção precisa ficar **acessível** (sem "Vercel Authentication" no domínio de produção). A proteção é feita pela chave da URL.

## 4. Supabase: liberar o schema do aprendizado (1 min)

O Claude já criou o schema `orcamentista` (tabelas `orcamentos` e `aprendizados`) no projeto **fixdoor-sistemas**, separado das tabelas de preço e kits.

1. Supabase › projeto **fixdoor-sistemas** › **Project Settings** › **Data API**.
2. Em **Exposed schemas**, adicione `orcamentista` e salve.

Para ver o histórico: Table Editor › seletor de schema › `orcamentista`.

## 5. claude.ai: adicionar o conector e a skill (5 min)

**Conector**
- **Só para você**: claude.ai › Settings › **Connectors** › **Add custom connector**:
  - nome: `Orçamentista FixDoor`
  - URL: a do passo 3.5
- **Para o time todo** (precisa ser owner da organização): Organization settings › **Connectors** › adicionar o mesmo conector. Cada pessoa depois ativa nas próprias configurações.
- Confirme que o conector **Omie** também está ativo.

**Skill**
1. claude.ai › Settings › **Capabilities** › **Skills** › **Upload skill** › arquivo `orcamentista-fixdoor.skill`.
2. Para o time: compartilhe a skill com a organização (se o plano permitir) ou peça que cada pessoa faça o upload.

## 6. Primeiros testes (com o Claude)

Faça nesta ordem, numa conversa nova:

1. **Mapear o RD**: "Use o Orçamentista para listar os funis e os campos personalizados do RD."
   - Com isso, o Claude completa `references/campos-rd.md`: rótulos exatos, id da etapa de aprovação e onde ficam os anexos.
   - Esse arquivo atualizado vai para uma nova versão da skill.
2. **Leitura sem gravar**: "Faça o resumo do card do cliente X, sem criar nada."
   - Confira se o resumo, o fiscal e o ICMS estão certos.
3. **Orçamento simples completo**: um card só de peças de tabela, indo até o Omie e a aprovação.
4. **Orçamento com pendência**: um card CIF sem cotação de frete. Confira se ele cria o orçamento e a tarefa no RD.
5. **Equipamento novo**: uma porta seccional com mão de obra terceirizada.

Depois de cada teste, as correções que você fizer ficam como **propostas** em `orcamentista.aprendizados`. Para virarem regra, diga ao Claude: "confirma o aprendizado N".

---

### Opcional: deixar o Claude testar o conector nesta sessão

Esta sessão do Claude Code na nuvem bloqueia a internet por padrão. Para o Claude testar tudo direto, adicione em **Allowed domains** (menu do ambiente › Edit › Network access):
- `crm.rdstation.com`
- `brasilapi.com.br`
- `publica.cnpj.ws`
- `orcamentista-mcp.vercel.app`
