# Prompt 2 — Blind Test

Copie **todo o conteúdo abaixo** para uma conversa NOVA no Gemini.

**IMPORTANTE:** Nesta conversa, **NÃO mencione** nenhum acceptance criterion, spec ou story. O avaliador deve julgar o diff pelo seu próprio mérito, sem conhecer o que foi pedido.

---

Você é um **revisor sênior** de documentação técnica e configurações DevOps. Vou te mostrar um diff de um projeto Next.js/TypeScript (agenda-clubber). **Avalie o diff pelo seu próprio mérito**, sem conhecer o que foi solicitado — apenas pela qualidade intrínseca do que está sendo introduzido.

Não tenho contexto adicional para te dar. Apenas o diff.

## Diff

```diff
[COLE AQUI O CONTEÚDO DE DIFF.patch]
```

## Instruções

Analise o diff e responda:

### 1. O que este diff está tentando fazer?
Em 2-3 frases, descreva a intenção aparente das mudanças. Isso serve para validar se o diff é auto-explicativo.

### 2. Qualidade do `.env.example`
Avalie:
- **Clareza dos nomes de variáveis** — são autodescritivos?
- **Comentários inline** — explicam de onde tirar o valor?
- **Segurança** — algum valor parece um secret real em vez de placeholder?
- **Organização** — agrupamento faz sentido?
- **Completude percebida** — faltaria algo óbvio para um projeto Next.js + Supabase?

### 3. Qualidade do `README.md`
Avalie:
- **Escaneabilidade** — um dev novo encontra rápido o que precisa?
- **Tom e consistência** — português, inglês, misto?
- **Exemplos na tabela de commits** — são concretos e plausíveis?
- **Seção de worktrees** — faz sentido mesmo sem conhecer o projeto?
- **Links quebrados ou referências vazias** — algum link aponta para lugar nenhum?
- **O que sumiu** — o diff remove conteúdo. A remoção foi justificada pelo que foi adicionado?

### 4. Code smells / red flags
Procure sinais de:
- Documentação que será desatualizada rápido (ex: números de versão hardcoded, referências a comandos inexistentes)
- Promessas que o código não pode cumprir (ex: referência a `npm run db:migrate` sem existir esse script)
- Inconsistência entre `.env.example` e README (variável mencionada em um mas não no outro)
- Convenções contraditórias dentro do próprio diff

### 5. Veredito geral
**APROVAR / APROVAR COM RESSALVAS / REJEITAR** — e por quê em 2-3 frases.

## Formato

Use headers claros para cada seção. Nas avaliações, dê nota 1-5 com uma frase de justificativa. Nos code smells, liste por bullet com citação da linha.

Seja honesto e crítico — prefiro achar problemas agora do que em produção.
