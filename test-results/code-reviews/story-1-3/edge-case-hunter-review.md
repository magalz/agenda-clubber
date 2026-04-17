# Edge Case Hunter Review

Aqui estão as descobertas da revisão focada em caminhos de exceção, condições de borda e robustez (Edge Case Hunter):

### 1. Concorrência e Estados de Corrida (Race Conditions)
- **Falta de Restrição Única (Unique Constraint) no Banco:** A regra de negócio proíbe nomes artísticos duplicados (verificado via `checkDuplicateArtist`), porém o schema do banco de dados (`src/db/schema/artists.ts`) **não possui** uma restrição `UNIQUE` (nem um índice único case-insensitive, ex: `CREATE UNIQUE INDEX ON artists (lower(artistic_name))`) na coluna `artisticName`.
- **Condição de Corrida no Registro de Artista:** No Server Action `saveArtistOnboardingAction`, a checagem `checkDuplicateArtist(artisticName)` e o subsequente `db.insert(artists)` não ocorrem dentro de uma transação travada (lock). Se dois usuários tentarem registrar o mesmo nome artístico exatamente ao mesmo tempo, ambos os processos receberão `false` na validação de duplicidade e farão a inserção com sucesso, burlando a regra do sistema.
- **Bypass do `SearchBeforeCreate`:** A interface trava o `artisticName` usando `readOnly`, mas um usuário mal-intencionado pode alterar o DOM ou enviar a requisição POST diretamente. O Server Action faz a revalidação corretamente, mas herda a falha da condição de corrida citada acima.

### 2. Validação de Entrada e Limites (Zod vs Banco de Dados)
- **Ausência de Limite Máximo de Caracteres:** O schema Zod `artistOnboardingSchema` define o limite mínimo (`min(2)`) para várias strings, mas **não define limite máximo** (`max()`). O banco de dados utiliza o tipo `text`, que suporta strings de tamanho virtualmente ilimitado. O envio de payloads gigantescos nesses campos pode causar problemas de performance (DoS) na aplicação e nas consultas com `ilike`.
- **URLs Permissivas e Limites de Texto:** Os campos de rede social usam `z.string().url()`, o que não limita o tamanho do texto do link nem restringe o protocolo (um usuário poderia tentar salvar `javascript:alert(1)` dependendo de onde e como essa URL for renderizada no futuro). Recomenda-se forçar os protocolos `http://` ou `https://`.
- **Espaços em Branco no Zod:** Um usuário poderia enviar o nome artístico como `"   "`. A função `checkDuplicateArtist` tem um fallback para `trim() === ""`, mas o Zod apenas valida o tamanho `.min(2)`. O ideal é usar `.trim()` no Zod para limpar o dado antes de qualquer processamento.

### 3. Casos Nulos/Indefinidos no Banco de Dados
- **Serialização de `undefined` no JSONB:** No `saveArtistOnboardingAction`, você agrupa `socialLinks: { soundcloud, youtube, instagram }`. Como os valores que não vierem no formulário são definidos como `undefined`, isso será repassado para o driver de banco de dados no campo JSONB. Dependendo de como o Drizzle ORM e o node-postgres lidam com objetos contendo `undefined`, as chaves podem ser omitidas, inseridas como string `"undefined"` ou a query pode quebrar. É mais seguro aplicar `Object.fromEntries(Object.entries(...).filter(([_, v]) => v != null))`.

### 4. Limites de Upload e Políticas de Storage
- **Brecha de Segurança no RLS do Storage:** No arquivo `002_storage_setup.sql`, a política `"Authenticated Insert"` permite que **qualquer usuário autenticado** faça upload para o bucket `artist_media`. Não há nenhuma validação na política do Supabase que restrinja:
  - O tamanho máximo do arquivo.
  - A extensão do arquivo (alguém poderia fazer upload de executáveis maliciosos).
  - O caminho do upload (um usuário poderia sobrescrever o arquivo de outro usuário caso descubra o nome ou pasta).

### 5. Tratamento de Erros Assíncronos
- **Falta de Logs para Erros Inesperados:** O bloco `catch (err: any)` em `saveArtistOnboardingAction` lida perfeitamente com a violação da restrição de unicidade do `profileId` (código `23505`), mas em caso de qualquer outra falha (ex: timeout do banco, queda de rede), o catch captura o erro silenciosamente e exibe a mensagem genérica `"Erro ao salvar perfil do artista."`. Esses erros críticos caem no vazio e não estão sendo logados (`console.error` ou serviço de monitoramento), dificultando muito o rastreamento em produção.
