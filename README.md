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
| `SUPABASE_SERVICE_KEY` | Chave secreta (service_role / sb_secret) do mesmo projeto |

No Supabase, o schema `orcamentista` precisa estar em **Project Settings › Data API › Exposed schemas**.

## Desenvolvimento

```bash
npm install
npm test          # regras de ICMS
npm run build
MCP_CHAVE=... RD_CRM_TOKEN=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run dev
```

## Ferramentas

`rd_buscar_negocios`, `rd_ler_negocio`, `rd_listar_anotacoes`, `rd_listar_tarefas`, `rd_criar_tarefa`,
`rd_criar_anotacao`, `rd_listar_funis`, `rd_mover_negocio`, `rd_listar_campos`, `rd_atualizar_campos`,
`rd_consulta_api` (GET livre), `rd_baixar_arquivo`, `consultar_cnpj`, `tabela_buscar_itens`, `calcular_precos`,
`aplicar_icms`, `aprendizados_listar`, `aprendizado_propor`, `aprendizado_definir_status`, `orcamento_registrar`,
`orcamento_historico`.
