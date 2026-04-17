# Relatório de Revisão: Blind Hunter

### 🚨 Erros de Lógica e Bugs Óbvios
1. **Ausência de Constraint `UNIQUE` em `artisticName`:** O negócio requer nomes artísticos únicos (validado no frontend via `checkDuplicateArtist`), mas o schema de banco de dados (`src/db/schema/artists.ts`) **não possui** a restrição `.unique()` na coluna `artisticName`. Isso introduz uma condição de corrida (*race condition*) crítica, permitindo que dois usuários registrem o mesmo nome se submeterem os formulários no mesmo milissegundo.
2. **Má Interpretação de Exceções de Banco de Dados:** No `catch` da função `saveArtistOnboardingAction`, qualquer erro de violação de restrição única do Postgres (`err.code === '23505'`) é traduzido fixamente para "Este perfil já completou o onboarding". Caso uma restrição `UNIQUE` seja adicionada a outras colunas futuramente (como o `artisticName`), este `catch` retornará mensagens de erro completamente enganosas aos usuários.

### ⚠️ Inconsistências Internas no Próprio Diff
1. **Contradição entre Comentário e Código em `isVerified`:** Na action `saveArtistOnboardingAction`, o comentário documenta de forma clara: `// Hardcoded verified false for now...`, no entanto, na linha imediatamente seguinte a lógica implementada insere `isVerified: true`. A implementação contradiz diretamente a intenção expressa pela documentação.

### 🛠️ Qualidade de Código, Padrões e Legibilidade
1. **Omissão de Feedback Visual para Erros de Validação:** O `artistOnboardingSchema` valida as URLs de Soundcloud, YouTube, Instagram e Presskit exigindo um formato de URL válido. Contudo, em `onboarding-form.tsx`, **não há código para renderizar** esses erros específicos (`state.error.fieldErrors.soundcloud`, etc.). O usuário tentará enviar, a validação no servidor falhará e a interface simplesmente não dirá onde está o problema.
2. **Tratamento Frágil de Strings em Campos Opcionais:** A atribuição `formData.get("soundcloud") || undefined` ignora strings vazias (o que é correto para o `z.union` no Zod), mas não lida com *whitespaces*. Se o usuário inserir um caractere de espaço (" "), passará a ser uma string não-vazia, o Zod rejeitará (pois não é uma URL) e o erro não será exibido na tela, travando o formulário silenciosamente.

### 🔒 Falhas de Segurança (Vulnerabilidades)
1. **Políticas Incompletas e Abusivas de Storage (RLS):** 
   - A regra `Authenticated Insert` autoriza *qualquer* usuário logado a realizar uploads irrestritos para o bucket `artist_media`. Isso possibilita que usuários inundem o bucket de arquivos mesmo sem terem concluído ou possuírem um perfil de artista válido.
   - **Ausência de Política `DELETE`:** Não há regras permitindo a deleção de objetos do storage. Se um usuário anexar uma mídia incorreta (ou dados sensíveis por acidente), ele não terá a capacidade de remover o arquivo da plataforma.