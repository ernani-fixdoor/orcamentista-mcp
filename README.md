# Orçamentista FixDoor · conector MCP

Conector (servidor MCP) usado pela skill **orcamentista-fixdoor** no Claude. Ele faz a ponte com:

- **RD Station CRM** (API v1, token): ler card, anotações, tarefas e arquivos; criar tarefa e anotação; mover etapa; preencher campos.
- **CNPJ**: BrasilAPI, com reserva na publica.cnpj.ws (UF, Simples Nacional, inscrições estaduais).
- **Tabela de preços FixDoor** (Supabase `fixdoor-sistemas`, `public.precos_*`): preço do **cliente final** com ICMS. As regras estão em `src/lib/icms.ts`, copiadas da tabela de preços e do consultor de ICMS/DIFAL.
- **Aprendizado** (Supabase, schema separado `orcamentista`): histórico de orçamentos e regras aprendidas.

O Omie **não** passa por aqui: a skill usa o conector oficial do Omie no claude.ai.

## URL do conector

```
https://<projeto>.vercel.app/<MCP_CHAVE>/mcp
```

Uma chave errada responde 404. Trate essa URL como senha.

## Variáveis de ambiente (Vercel)

| Nome | O que é |
|---|---|
| `MCP_CHAVE` | Chave secreta da URL, com pelo menos 16 caracteres (`openssl rand -hex 24`) |
| `RD_CRM_TOKEN` | Token da API do RD Station CRM |
| `SUPABASE_URL` | URL do projeto `fixdoor-sistemas` |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável (`sb_publishable_...`) do mesmo projeto |
| `RD_CLIENT_ID` / `RD_CLIENT_SECRET` | App OAuth do RD App Publisher (API v2, usada para anexos). Callback: `https://orcamentista-fixdoor.vercel.app/<MCP_CHAVE>/rd-oauth` |
| `ORC_DB_CHAVE` | Chave do Orçamentista no banco; o hash SHA-256 dela fica em `orcamentista.config` (`api_chave_sha256`) |
| `OMIE_FIXDOOR_APP_KEY` / `OMIE_FIXDOOR_APP_SECRET` | Chave de API do Omie da FixDoor (Omie > Configurações > Chaves de API). Só para `omie_anexar_arquivo` |
| `OMIE_MAXDOCK_APP_KEY` / `OMIE_MAXDOCK_APP_SECRET` | Idem, para a MaxDock. Nunca cadastre a Fast & Safe |

O conector **não usa a service key**: ele só chama as funções `public.orc_*` (SECURITY DEFINER), que conferem a `ORC_DB_CHAVE`.
Elas leem a tabela de preços (só leitura) e gravam o histórico e os aprendizados no schema `orcamentista`.
Para trocar a chave, gere uma nova, grave o hash com
`update orcamentista.config set valor = encode(sha256(convert_to('<nova>','UTF8')),'hex') where chave='api_chave_sha256';`
e atualize `ORC_DB_CHAVE` na Vercel.

## Desenvolvimento

```bash
npm install
npm test          # regras de ICMS
npm run build
cp .env.example .env.local   # preencha
npm run dev
```

## Ferramentas

`rd_buscar_negocios`, `rd_ler_negocio`, `rd_listar_anotacoes`, `rd_listar_tarefas`, `rd_criar_tarefa`,
`rd_criar_anotacao`, `rd_listar_funis`, `rd_mover_negocio`, `rd_listar_campos`, `rd_atualizar_campos`,
`rd_consulta_api` (GET livre), `rd_baixar_arquivo`, `consultar_cnpj`, `tabela_buscar_itens`, `calcular_precos`,
`rd_renomear_negocio`, `rd_adicionar_numero_titulo`, `rd_listar_produtos_catalogo`, `rd_definir_valor_produtos`, `rd_listar_produtos_negocio`, `rd_anexar_arquivo`, `rd_listar_arquivos`, `rd_excluir_arquivo` (com confirmação),
`rd_editar_anotacao` (experimental, com confirmação), `aplicar_icms`, `aprendizados_listar`, `aprendizado_propor`, `aprendizado_definir_status`, `orcamento_registrar`,
`orcamento_historico`, `consultar_tipi`, `calcular_mola` (calculadora DOCO via Chromium sem tela + R$ 180/kg; cada opção traz `pdf_calculo_url`, o PDF do botão Print da DOCO). Diagnóstico das molas: `GET /<MCP_CHAVE>/mola`.
`omie_anexar_arquivo` (anexa um arquivo, por URL https pública, ao pedido de venda da FixDoor ou à OS da MaxDock).

## Anexos no Omie

O conector Omie oficial do Claude não envia arquivo local, e o `IncluirAnexo` exige o arquivo em ZIP e base64. `omie_anexar_arquivo` resolve isso no servidor:
baixa a URL, compacta (`src/lib/zip.ts`), calcula o MD5, chama `geral/anexo:IncluirAnexo` e confere em `ListarAnexo`.
- `id` é o código interno: `codigo_pedido` do pedido de venda (não o número 5712) ou `nCodOS` da OS.
- Limite de 8 MB por arquivo. A documentação do Omie não diz se o `cMd5` é do ZIP ou do base64: a ferramenta tenta o do ZIP e, se o Omie reclamar de MD5, repete com o do base64 (o resultado informa qual valeu).
- Sem as variáveis `OMIE_<EMPRESA>_APP_KEY/SECRET`, a ferramenta falha cedo com mensagem clara.

## RD Station API v2 (anexos)

A API v1 (token) não tem anexos. Para anexar PDFs, o conector usa a v2 com OAuth:
1. Autorização única: abra `https://orcamentista-fixdoor.vercel.app/<MCP_CHAVE>/rd-oauth` e autorize a conta.
2. Os tokens ficam em `orcamentista.config` (`rd_oauth_*`). O access token dura 2 h e é renovado sozinho; o refresh token expira se ficar **14 dias sem uso**. Nesse caso, autorize de novo.
3. Status: `/<MCP_CHAVE>/rd-oauth?status` ou `/<MCP_CHAVE>/saude`.

A v2 não permite excluir anotações nem fixá-las. A edição (`PUT /deals/{id}/notes/{id}`) não é documentada: está como experimental.
