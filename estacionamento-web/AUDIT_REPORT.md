# Relatório de Auditoria de Segurança e Produção

## SEÇÃO 1 — Riscos Críticos
- **Autenticação do Supabase**: A chave e a URL do seu banco Supabase (`src/lib/supabase.ts`) estão hardcoded (escritos diretamente no código base). Como se tratam das chaves *anon/publishable*, elas têm o risco mitigado por RLS (Row Level Security). Contudo, em código de produção, expor essas chaves no controle de versão é uma má prática de segurança. Elas devem ser transferidas para arquivos `.env.local` usando as variáveis correspondentes.
- **Não há outros riscos eminentes (como injections ou service keys expostas no client)**. O Firebase Admin está sendo inicializado corretamente de forma Server-Side.

## SEÇÃO 2 — Melhorias Recomendadas
- **Variáveis de Ambiente**: Mover `supabaseUrl` e `supabaseKey` presentes em `src/lib/supabase.ts` para um arquivo responsável pelas variáveis de ambiente (`.env`). Exemplo de criação: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Cabeçalhos de Segurança (Security Headers)**: É recomendado adicionar headers de segurança como `Content-Security-Policy`, `X-Frame-Options` e `Strict-Transport-Security` dentro do `next.config.ts`.
- **Validação de Upload de Arquivos**: Como o app já lida com imagens (camera, CNH, etc), seria ideal implementar uma validação em back-end ou checagem de tamanho (ex: limitar a imagens de 5MB) para evitar onerar o Bucket.

## SEÇÃO 3 — Arquivos Não Utilizados
Os seguintes arquivos encontrados na pasta `src/lib/` são migrações antigas ou backups de scripts SQL que **não estão sendo importados nem utilizados** por nenhuma parte do sistema. São perfeitamente seguros para exclusão de forma a manter o repositório limpo:
- `migration_add_auth_fields.sql`
- `migration_add_destinatario.sql`
- `migration_add_fcm_token.sql`
- `migration_add_observacoes_pre_autorizacao.sql`
- `migration_add_observacoes_visitas.sql`
- `migration_add_pre_autorizacao.sql`
- `migration_add_retirado_por.sql`
- `migration_allow_null_morador_id.sql`
- `migration_chat.sql`
- `migration_encomendas_incompletas.sql`
- `migration_multi_device_tokens.sql`
- `migration_rpc_fcm.sql`
- `sql_setup.sql`

*(Aviso: É recomendado que guarde esses arquivos em outro repositório de documentação, caso use de referência para criar novas tabelas).*

## SEÇÃO 4 — Dependências
As dependências do projeto contidas no `package.json` estão atualizadas e refletem o ecossistema atual do React 19 / Next 16 (Turbopack).
- Não há pacotes perigosos ou obsoletos ativos. 
- O projeto consome muito pouco das dependências. Nenhuma dependência não utilizada foi mapeada explicitamente nas rotas do Client.

## SEÇÃO 5 — Configuração de Produção
- `next.config.ts`: O arquivo de configuração atual encontra-se vazio. O Turbopack vem lidando com as renderizações. Porém, a ausência da ativação explícita de `reactStrictMode: true` pode mascarar problemas de re-renderização dupla no ambiente de desenvolvimento, e source maps serão gerados na produção se não desativados ou mitigados.

## SEÇÃO 6 — Correções Aplicadas
Ao redor do aplicativo, foram aplicadas correções curtas e inteiramente focadas em **limpeza de logs de transação:**
- **Remoção de Console.logs de Produção:**
  - `src/hooks/useFcmToken.ts`: Diversos `console.log` registravam que a tentativa de obtenção do token FCM havia sido bem sucedida e listavam o Token cru de volta na aba Console do Client Side. Isso foi limpo.
  - `src/hooks/useStorage.ts`: Um request API registrava detalhes de payloads entre a máquina e o backend do sistema através do `console.log`. Foi limpo. 
As correções reduzem detecções sensíveis e tornam o front mais discreto em ferramentas de DevTools.

## SEÇÃO 7 — Itens que NÃO foram alterados por segurança
Nenhuma alteração de refatoração de código, API ou banco de dados foi feita como medida estrita de estabilidade operacional.
Os SQL's mencionados continuam salvos na árvore de domínio `src/lib`, aguardando permissão de equipe/Sênior caso devam ser varridos; bem como as chaves do Supabase, que se mantêm *hardcoded* pois sua remoção pode quebrar funcionalidades caso as VENV globais não estejam setadas corretamente na máquina de hospedagem (Vercel/Netlify).
