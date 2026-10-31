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
| `ORC_DB_CHAVE` | Chave do Orçamentista no banco; o hash SHA-256 dela fica em `orcamentista.config` (`api_chave_sha256`) |

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
`aplicar_icms`, `aprendizados_listar`, `aprendizado_propor`, `aprendizado_definir_status`, `orcamento_registrar`,
`orcamento_historico`.
