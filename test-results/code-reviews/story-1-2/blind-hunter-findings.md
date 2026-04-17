# Blind Hunter Findings — Story 1.2

- **Asserção não nula perigosa em variáveis de ambiente:** O `middleware.ts` utiliza `!` para `NEXT_PUBLIC_SUPABASE_URL` e `KEY`, o que causará um crash em tempo de execução se essas variáveis estiverem ausentes no ambiente.
- **Redundância ineficiente no `setAll` do Middleware:** A função `setAll` cria uma nova instância de `NextResponse.next` duas vezes no mesmo loop de cookies, o que é ineficiente e pode causar problemas na propagação de cabeçalhos.
- **Latência de Banco de Dados por requisição no Middleware:** Toda requisição para `/admin` dispara uma query ao Supabase para verificar o `role` no `profiles`; isso deveria ser otimizado via metadados de sessão (JWT) ou cache para evitar gargalos.
- **Ofuscação de erros no `signInAction`:** Qualquer erro do Supabase é substituído pela mensagem genérica "Credenciais inválidas", impedindo o usuário de saber se o problema é um e-mail não confirmado ou conta bloqueada.
- **Estado de sucesso morto em `SignInState`:** O tipo define `data: { success: boolean }`, mas a ação nunca retorna esse objeto, optando por um `redirect` direto que torna essa propriedade do estado inútil.
- **Mudança quebra-tudo no `tsconfig.json`:** Alterar o alias `@/*` de `./*` para `./src/*` é um breaking change para qualquer arquivo de configuração ou utilitário na raiz que dependa desse caminho absoluto.
- **Configuração de E2E lenta e não-produtiva:** O `playwright.config.ts` utiliza `npm run dev` no `webServer`, o que é desencorajado por ser mais lento e menos fiel ao comportamento de produção do que o build/start.
- **Falta de feedback visual no Logout:** O botão de sair é desabilitado durante a transição, mas não há um spinner ou mudança visual no ícone `LogOut` para indicar que o processo de encerramento de sessão está ocorrendo.
- **Falha silenciosa de autorização no Middleware:** Se a query de perfil falhar ou retornar nula, o usuário é redirecionado para `/dashboard` sem nenhum log ou rastreio de erro, dificultando a depuração de problemas de acesso.
- **Mocks manuais frágeis no `middleware.test.ts`:** O teste reconstrói manualmente as classes `NextRequest` e `NextResponse`, o que pode divergir do comportamento real do Next.js e gerar falsos positivos nos testes.
- **Caminhos de redirecionamento "hardcoded" espalhados:** Rotas como `/auth/login` e `/dashboard` estão escritas manualmente em múltiplos arquivos (middleware, actions, componentes), dificultando manutenções futuras em nomes de rotas.
- **Falta de atributos de acessibilidade e segurança no Input:** O campo de senha no `LoginForm` não possui atributos como `autoComplete` ou validações básicas de cliente (`minLength`), dependendo exclusivamente do Zod no servidor.
