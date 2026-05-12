# Story 4.3: Notificações Admin via WhatsApp Group

Status: ready-for-dev

## Story

As a **platform Admin**,
I want **to receive alerts for pending approvals in a dedicated WhatsApp group**,
so that **I can maintain the platform's integrity without checking the dashboard constantly**.

## Acceptance Criteria

Verbatim de [`_bmad-output/planning-artifacts/epics.md:601-613`](../planning-artifacts/epics.md):

1. **Given** a new Collective registration, new Artist registration, or Profile Claim
2. **When** the record enters the `pending_approval` state
3. **Then** a notification must be sent via **Evolution API** to the configured **Admin WhatsApp Group**
4. **And** the message must include the type of request and a link to the Admin Dashboard
5. **And** the operation must be asynchronous to maintain system performance.

> **Nota de interpretação:**
> - **AC #1-2:** Três triggers distintos: (a) `createCollectiveAction` quando `collectives.status === 'pending_approval'`, (b) `createOnTheFlyArtistAction` quando `artists.status === 'pending_approval'` (se email fornecido, a notificação On-the-fly artist email já existe — a notificação WhatsApp é adicional para admins), (c) fluxo de Claim quando artista reivindica perfil e status muda para `pending_approval`.
> - **AC #3:** Usar `sendAdminGroupMessage(message)` de `src/lib/evolution-api.ts` — já implementada e testada. A mensagem deve seguir o padrão queue-first (QStash → Webhook → Evolution API), idêntico ao fluxo de notificação de artist claim.
> - **AC #4:** A mensagem deve conter: tipo da solicitação (Coletivo, Artista, Reivindicação), nome do solicitante, data/hora, e link para `/admin`.
> - **AC #5:** Usar QStash (`enqueueAdminWhatsAppNotification`) para desacoplar a chamada HTTP da Evolution API da Server Action, exatamente como `enqueueArtistClaimInvitation` faz para emails.

## Tasks / Subtasks

- [ ] **T1 · Fila QStash para notificação WhatsApp (AC 5)**
  - [ ] Adicionar `enqueueAdminWhatsAppNotification(payload)` em `src/features/notifications/qstash.ts`:
    - Payload: `{ type: 'collective' | 'artist' | 'claim', name: string, timestamp: string }`
    - Seguir exatamente o padrão de `enqueueArtistClaimInvitation`:
      - Guard: `if (!process.env.QSTASH_TOKEN) return { queued: false, error: "..." }`
      - Guard: `if (!process.env.NEXT_PUBLIC_SITE_URL) return { queued: false, error: "..." }`
      - `await qstashClient.publishJSON({ url, body })` apontando para `/api/webhooks/notifications/admin-whatsapp`
      - Retorno: `{ queued: boolean; error?: string }`
  - [ ] NÃO modificar `enqueueArtistClaimInvitation` — cada enqueue é independente
  - [ ] Testar: criar `src/features/notifications/qstash.test.ts` OU estender existente com testes para `enqueueAdminWhatsAppNotification`:
    - Testar sucesso (QStash chamado com URL e payload corretos)
    - Testar falha (QSTASH_TOKEN não configurado)
    - Testar falha (NEXT_PUBLIC_SITE_URL não configurado)

- [ ] **T2 · Webhook consumer (AC 3)**
  - [ ] Criar `src/app/api/webhooks/notifications/admin-whatsapp/route.ts`:
    - Importar `verifySignatureAppRouter` de `@upstash/qstash/nextjs`
    - Schema Zod para payload: `z.object({ type: z.enum(['collective', 'artist', 'claim']), name: z.string().min(2), timestamp: z.string() })`
    - Handler: recebe payload, monta mensagem formatada, chama `sendAdminGroupMessage(formattedMessage)`
    - Formato da mensagem:
      ```
      🔔 Nova solicitação pendente no Agenda Clubber
      Tipo: {tipo em PT-BR: "Cadastro de Coletivo" | "Cadastro de Artista" | "Reivindicação de Perfil"}
      Nome: {name}
      Data: {timestamp}
      👉 Acesse o painel admin: {siteUrl}/admin
      ```
    - Retorno: `Response.json({ ok: true })` em sucesso, `{ error }` com status 500 em falha
    - Log: `console.info("[admin-whatsapp] Notification sent", { type, name })`
    - Seguir IDÊNTICO padrão de `src/app/api/webhooks/notifications/artist-claim/route.ts` (Zod, verifySignature, error handling, Response.json)
  - [ ] Criar `src/app/api/webhooks/notifications/admin-whatsapp/route.test.ts`:
    - Testar payload válido → sendAdminGroupMessage chamado com mensagem formatada
    - Testar payload inválido → 400
    - Testar sendAdminGroupMessage falha → 500 com log de erro

- [ ] **T3 · Trigger: createCollectiveAction (AC 1, parte coletivo)**
  - [ ] Atualizar `src/features/collectives/actions.ts`:
    - Localizar `createCollectiveAction()` — encontrar onde o coletivo insere no DB
    - Após a inserção bem-sucedida com `status: 'pending_approval'`, chamar `enqueueAdminWhatsAppNotification({ type: 'collective', name: collective.name, timestamp: new Date().toISOString() })`
    - **IMPORTANTE:** Não aguardar a promise — fire-and-forget (a fila QStash garante a entrega, e o usuário não deve esperar pela notificação para receber resposta)
    - **Regra:** Se o QStash falhar no enqueue, logar o erro mas NÃO falhar a Server Action — o coletivo já foi criado, a notificação é secundária
  - [ ] Estender testes existentes de `createCollectiveAction` para verificar que `enqueueAdminWhatsAppNotification` é chamada (mockada) com type='collective'

- [ ] **T4 · Trigger: createOnTheFlyArtistAction (AC 1, parte artista on-the-fly)**
  - [ ] Atualizar `src/features/artists/actions.ts`:
    - Localizar `createOnTheFlyArtistAction()` — onde cria perfil restrito com `status: 'pending_approval'`, `isVerified: false`
    - Após inserção bem-sucedida, chamar `enqueueAdminWhatsAppNotification({ type: 'artist', name: artisticName, timestamp: new Date().toISOString() })`
    - **Importante:** A notificação de email para o artista (`enqueueArtistClaimInvitation`) já existe e deve CONTINUAR sendo enviada quando email é fornecido — a notificação WhatsApp para admins é ADICIONAL
    - Fire-and-forget: não aguardar, logar erro sem falhar
  - [ ] Estender testes de `createOnTheFlyArtistAction` para verificar chamada extra ao `enqueueAdminWhatsAppNotification`

- [ ] **T5 · Trigger: Claim Flow (AC 1, parte claim)**
  - [ ] Localizar o fluxo de Claim (reivindicação de perfil) — provavelmente no actions de artists
  - [ ] Identificar onde o status do artista muda para `pending_approval` durante o claim
  - [ ] Adicionar `enqueueAdminWhatsAppNotification({ type: 'claim', name: artist.artisticName, timestamp: new Date().toISOString() })` no mesmo ponto
  - [ ] Fire-and-forget, logar erro sem falhar

- [ ] **T6 · Atualizar .env.example (documentação)**
  - [ ] Adicionar `EVOLUTION_ADMIN_GROUP_ID` no `.env.example` na seção Evolution API (linhas ~82-86, atualmente comentada "Future: Evolution API")
  - [ ] Documentar formato: `5511999999999-123456@g.us` (WhatsApp Group ID)
  - [ ] Descomentar as variáveis Evolution API existentes já que agora são usadas

- [ ] **T7 · Testes E2E**
  - [ ] Criar/estender `e2e/admin-whatsapp.spec.ts`:
    - **Test 1:** Criar collective via UI → verificar que QStash recebeu enqueue (mockar Evolution API endpoint)
    - **Test 2:** Criar artista on-the-fly via UI → verificar webhook chamado
    - **Test 3:** Verificar que fluxo principal não quebra se Evolution API estiver offline

- [ ] **T8 · Regressões e qualidade**
  - [ ] Rodar `npm run type-check` — zero erros
  - [ ] Rodar `npm run lint` — zero warnings
  - [ ] Rodar `npm test` — todos os testes passam
  - [ ] Verificar que `enqueueArtistClaimInvitation` não foi alterada (regressão)
  - [ ] Verificar que `createCollectiveAction` não quebrou para coletivos ativos (sem pending_approval)
  - [ ] Rodar `npm run qa:memtrace` — gate de qualidade

## Dev Notes

### Arquitetura de notificações (padrão estabelecido)

O sistema segue o padrão **queue-first** já implementado para notificações de artist claim:

```
Server Action → enqueueAdminWhatsAppNotification(payload)
  → QStash publishJSON → /api/webhooks/notifications/admin-whatsapp
    → verifySignatureAppRouter (auth)
      → Zod payload validation
        → sendAdminGroupMessage(text)
          → Evolution API → WhatsApp Group
```

**Por que queue-first?**
- Desacopla a Server Action da chamada HTTP externa (Evolution API)
- Garante retentativa automática via QStash em caso de falha
- Mantém performance da Server Action (fire-and-forget)
- Segue o mesmo padrão já validado de `enqueueArtistClaimInvitation`

### Código existente reaproveitado

| Componente | Arquivo | Uso |
|---|---|---|
| `sendAdminGroupMessage()` | `src/lib/evolution-api.ts:59-74` | **REAPROVEITAR** — já implementado, testado (3 testes) |
| `generateAdminGroupDeepLink()` | `src/lib/evolution-api.ts:76-79` | **REAPROVEITAR** — se necessário para deep link |
| `qstashClient` | `src/features/notifications/qstash.ts:3` | **REAPROVEITAR** — instância já exportada |
| `enqueueArtistClaimInvitation` pattern | `src/features/notifications/qstash.ts:11-31` | **COPIAR PADRÃO** — mesmos guards, mesmo try/catch, mesmo retorno |
| `artist-claim/route.ts` pattern | `src/app/api/webhooks/notifications/artist-claim/route.ts` | **COPIAR PADRÃO** — Zod + verifySignature + Response.json |
| `createCollectiveAction` | `src/features/collectives/actions.ts` | **ATUALIZAR** — adicionar enqueue |
| `createOnTheFlyArtistAction` | `src/features/artists/actions.ts` | **ATUALIZAR** — adicionar enqueue |

### NÃO modificar sem necessidade

- `src/lib/resend.ts` — Email integration, não tocar
- `src/app/api/webhooks/notifications/artist-claim/route.ts` — Webhook de artist claim, NÃO modificar
- `src/lib/evolution-api.ts` — Evolution client já está correto, NÃO alterar a API do `sendAdminGroupMessage`
- `src/db/schema/collectives.ts` — Schema de collectives (já tem `whatsappPhone`)
- `src/db/schema/artists.ts` — Schema de artists (já tem `status` enum)
- `src/db/schema/event-conflicts.ts` — Schema de conflitos (já tem `consensual_agreement`)

### Formatos de payload

**QStash payload (enqueueAdminWhatsAppNotification):**
```ts
type AdminWhatsAppPayload = {
    type: 'collective' | 'artist' | 'claim';
    name: string;
    timestamp: string; // ISO 8601
};
```

**Mensagem WhatsApp final (formatada):**
```
🔔 Nova solicitação pendente no Agenda Clubber
Tipo: Cadastro de Coletivo
Nome: Coletivo Ignis
Data: 2026-05-12T14:30:00-03:00
👉 Acesse o painel admin: https://agendaclubber.com/admin
```

### Decisiones arquiteturais

- **Fire-and-forget:** A notificação WhatsApp NÃO deve bloquear o fluxo principal. Usar `void` ou `.catch()` na chamada do enqueue, sem await. Se QStash falhar, apenas logar o erro.
- **NÃO duplicar código:** O helper de formatação de mensagem deve viver em `src/lib/evolution-api.ts` como `formatAdminNotificationMessage(type, name, timestamp)` — exportado E testado separadamente.
- **Admin Dashboard link:** Usar `process.env.NEXT_PUBLIC_SITE_URL + '/admin'` — mesmo padrão usado em `src/features/notifications/qstash.ts:22-23`.
- **Timestamp:** Usar `new Date().toISOString()` no momento do enqueue (Server Action). Exibir no fuso local do admin não é necessário — o Evolution API entrega o texto como está.

### Testing standards summary

- **Unitários (Vitest):** Testar `enqueueAdminWhatsAppNotification` isoladamente (mockar QStash). Testar formatação de mensagem. Testar triggers nos server actions (mockar `enqueueAdminWhatsAppNotification`).
- **Integração (Vitest):** Testar webhook consumer com payload válido/inválido. Testar fallbacks sem env vars.
- **E2E (Playwright):** Cenário de criação de coletivo → verifica notificação enfileirada. Cenário de artista on-the-fly → verifica notificação enfileirada.

### Source tree components to touch

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/features/notifications/qstash.ts` | UPDATE | Adicionar `enqueueAdminWhatsAppNotification()` — seguir padrão existente |
| `src/features/notifications/qstash.test.ts` | NEW (ou estender existente) | Testes do novo enqueue |
| `src/app/api/webhooks/notifications/admin-whatsapp/route.ts` | NEW | Webhook consumer com Zod + verifySignature |
| `src/app/api/webhooks/notifications/admin-whatsapp/route.test.ts` | NEW | Testes do webhook |
| `src/lib/evolution-api.ts` | UPDATE | Adicionar `formatAdminNotificationMessage(type, name, timestamp)` |
| `src/lib/evolution-api.test.ts` | UPDATE | Testes do formatador |
| `src/features/collectives/actions.ts` | UPDATE | Fire-and-forget enqueue após `createCollectiveAction` |
| `src/features/collectives/actions.test.ts` | UPDATE | Verificar chamada ao enqueue |
| `src/features/artists/actions.ts` | UPDATE | Fire-and-forget enqueue após `createOnTheFlyArtistAction` |
| `src/features/artists/actions.test.ts` | UPDATE | Verificar chamada ao enqueue |
| `.env.example` | UPDATE | Documentar `EVOLUTION_ADMIN_GROUP_ID`, descomentar Evolution vars |
| `e2e/admin-whatsapp.spec.ts` | NEW | Testes E2E de notificação |

### Dependências

- **Nenhuma nova dependência de runtime.** Tudo já está no projeto:
  - `@upstash/qstash` — já instalado (v2.10.1)
  - `resend` — já instalado (não usado nesta story)
  - Evolution API — cliente já implementado em `src/lib/evolution-api.ts`
  - `zod` — já instalado (v4)
- **Infraestrutura necessária:** Evolution API Docker (`docker-compose.evolution.yml`) para testes manuais e E2E. `EVOLUTION_ADMIN_GROUP_ID` real em produção.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3](linhas 601-613 — ACs verbatim)
- [Source: _bmad-output/planning-artifacts/epics.md#Functional-Requirements](FR26 — WhatsApp para admins)
- [Source: _bmad-output/planning-artifacts/prd.md#Notificações-e-Automação](FR26 — notificação WhatsApp)
- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements](linhas 180 — FR26 verbatim)
- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions](Integração Evolution API + QStash)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform-Strategy](Mobilidade via Bot WhatsApp)
- [Source: _bmad-output/implementation-artifacts/epic-4-readiness.md](Spike Evolution API — pré-requisitos)
- [Source: src/lib/evolution-api.ts](sendAdminGroupMessage — já implementado)
- [Source: src/lib/evolution-api.test.ts](Testes existentes da Evolution API)
- [Source: src/features/notifications/qstash.ts](Padrão de enqueue QStash existente)
- [Source: src/app/api/webhooks/notifications/artist-claim/route.ts](Padrão de webhook consumer existente)
- [Source: .env.example](Variáveis Evolution API comentadas)
- [Source: src/features/collectives/actions.ts](createCollectiveAction — trigger de collective)
- [Source: src/features/artists/actions.ts](createOnTheFlyArtistAction — trigger de artista)

## QA Maturity Checklist

### QA-Design (pré-DS)
- [ ] Acceptance test scaffolds gerados (bmad-testarch-atdd)
- [ ] Estratégia de teste definida (bmad-testarch-test-design)

### QA-Verify (pós-DS)
- [ ] Testes unitários passam
- [ ] Testes E2E passam
- [ ] Test-review aprovado (bmad-testarch-test-review)
- [ ] Rastreabilidade ACs → testes verificada (bmad-testarch-trace)
- [ ] Cobertura mínima: 80% linhas, 100% ACs
- [ ] Zero regressões nos testes existentes
- [ ] QA Gate Report emitido e anexado ao story file

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash (via opencode)

### Debug Log References

### Completion Notes List

### File List
