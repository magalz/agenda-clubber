# Test Design — Story 4.3: Notificações Admin via WhatsApp Group

**Date:** 2026-05-12
**Author:** 🧪 Murat (Master Test Architect)
**Version:** 1.0

---

## 1. Risk Assessment

| Risk | Probability | Impact | Score | Mitigation |
|------|------------|--------|-------|------------|
| Evolution API offline | Média (P3) | Alto (I4) | **P3×I4=12** | Webhook retorna 500 sem crash; QStash retry automático |
| Payload inválido via QStash | Baixa (P2) | Alto (I4) | **P2×I4=8** | Zod schema validation no webhook |
| `enqueueAdminWhatsAppNotification` falha | Média (P3) | Médio (I3) | **P3×I3=9** | Fire-and-forget; log de erro; não quebra Server Action |
| Regressão em `enqueueArtistClaimInvitation` | Baixa (P2) | Alto (I4) | **P2×I4=8** | Teste de regressão explícito |
| Concorrência: duas notificações simultâneas | Baixa (P2) | Baixo (I2) | **P2×I2=4** | QStash garante ordering por mensagem |
| Race condition no claim + WhatsApp | Baixa (P2) | Médio (I3) | **P2×I3=6** | QStash fila após redirect |

**Overall Risk Rating:** **Médio** — riscos gerenciáveis com testes nas 3 camadas.

---

## 2. Coverage Strategy

### 2.1 Acceptance Criteria → Test Map

| AC | Test Type | Test File | Verification |
|----|-----------|-----------|-------------|
| AC #1-2: Trigger collective `pending_approval` | Unit (Integração) | `collectives/actions.test.ts` | `enqueueAdminWhatsAppNotification` chamado com `type='collective'` |
| AC #1-2: Trigger artist on-the-fly | Unit (Integração) | `artists/actions.test.ts` | `enqueueAdminWhatsAppNotification` chamado com `type='artist'` |
| AC #1-2: Trigger claim `pending_approval` | Unit (Integração) | `artists/actions.test.ts` | `enqueueAdminWhatsAppNotification` chamado com `type='claim'` |
| AC #3: Webhook → Evolution API | Unit (Webhook) | `admin-whatsapp/route.test.ts` | `sendAdminGroupMessage` chamado com payload formatado |
| AC #4: Mensagem com tipo + nome + data + link | Unit (Webhook) | `admin-whatsapp/route.test.ts` | Conteúdo da mensagem verificado por regex |
| AC #5: Assíncrono (fire-and-forget) | Unit (QStash) | `qstash.test.ts` | `publishJSON` chamado, retorno `{ queued: true }` |

### 2.2 Test Pyramid

```
        ╱╲
       ╱E2E╲       3 testes (Playwright)
      ╱─────╲
     ╱ Integ.╲     6 testes (Vitest - actions + webhook)
    ╱─────────╲
   ╱  Unit     ╲   7 testes (Vitest - qstash + evolution-api formatador)
  ╱─────────────╲
```

### 2.3 Test Levels Detail

#### Unit Tests (Vitest)

| # | Test | File | Expected | Priority |
|---|------|------|----------|----------|
| U1 | `enqueueAdminWhatsAppNotification` publica JSON no QStash | `qstash.test.ts` | `{ queued: true }` | **P0** |
| U2 | QSTASH_TOKEN ausente → retorna erro | `qstash.test.ts` | `{ queued: false, error }` | **P0** |
| U3 | NEXT_PUBLIC_SITE_URL ausente → retorna erro | `qstash.test.ts` | `{ queued: false, error }` | **P0** |
| U4 | QStash rejeita → retorna erro | `qstash.test.ts` | `{ queued: false, error }` | **P1** |
| U5 | `formatAdminNotificationMessage` formata corretamente para collective | `evolution-api.test.ts` | Contém "Cadastro de Coletivo" + nome + link | **P0** |
| U6 | `formatAdminNotificationMessage` formata para artist | `evolution-api.test.ts` | Contém "Cadastro de Artista" | **P1** |
| U7 | `formatAdminNotificationMessage` formata para claim | `evolution-api.test.ts` | Contém "Reivindicação de Perfil" | **P1** |

#### Integration Tests (Vitest)

| # | Test | File | Expected | Priority |
|---|------|------|----------|----------|
| I1 | Webhook: payload coletivo válido → 200 | `route.test.ts` | `{ ok: true }`, `sendAdminGroupMessage` chamado | **P0** |
| I2 | Webhook: payload artista válido → mensagem com "Cadastro de Artista" | `route.test.ts` | Mensagem contém tipo correto | **P0** |
| I3 | Webhook: payload claim válido → mensagem com "Reivindicação de Perfil" | `route.test.ts` | Mensagem contém tipo correto | **P0** |
| I4 | Webhook: type inválido → 400 | `route.test.ts` | `res.status === 400` | **P1** |
| I5 | Webhook: sem name → 400 | `route.test.ts` | `res.status === 400` | **P1** |
| I6 | Webhook: Evolution API falha → 500 | `route.test.ts` | `res.status === 500` | **P0** |
| I7 | Webhook: JSON inválido → 400 | `route.test.ts` | `res.status === 400` | **P1** |

#### Severity Breakdown per Trigger

Process | Flows | Test Coverage |
|---------|-------|--------------|
| `createCollectiveAction` | 2 steps | I: `enqueueAdminWhatsAppNotification` mockado + fire-and-forget |
| `createOnTheFlyArtistAction` | 5 steps | I: enqueue adicional + email existente intacto |
| `claimArtistProfileAction` | 3 steps | I: enqueue após status `pending_approval` |
| (novo) Webhook QStash consumer | 3 steps | I: Zod + verifySignature + Evolution API call |

#### E2E Tests (Playwright — novo spec)

| # | Test | Scenario | Priority |
|---|------|----------|----------|
| E1 | Criar coletivo via UI → verifica enqueue | Admin cria coletivo → Evolution API endpoint mockado recebe chamada | **P0** |
| E2 | Criar artista on-the-fly via UI → verifica enqueue | Admin cria artista → webhook chamado | **P1** |
| E3 | Evolution API offline → fluxo principal intacto | Mock Evolution API retorna 503 → UI não quebra | **P1** |

---

## 3. Edge Cases & Error Handling

| Edge Case | Expected Behavior |
|-----------|------------------|
| QStash enqueue falha | Log de erro; Server Action NÃO falha; coletivo/artista ainda criado |
| Evolution API offline | Webhook retorna 500; QStash retenta automaticamente |
| Payload com `name` muito longo (>500 chars) | Zod `min(2)` mas sem `max` — aceitar |
| `type` não enum (`collective`/`artist`/`claim`) | 400 Bad Request |
| Timestamp em formato inválido | Aceitar string — Evolution API entrega texto como está |
| `createCollectiveAction` com collective ativo (`status != pending_approval`) | NÃO disparar notificação WhatsApp |
| Dois triggers simultâneos (ex: criar coletivo + claim ao mesmo tempo) | QStash garante fila por mensagem individual |

---

## 4. Fixtures & Test Data Strategy

### Factories Needed

```typescript
// createAdminWhatsAppPayload(overrides) — para webhook tests
// createCollectivePendingApproval(overrides) — para trigger tests
// createArtistPendingApproval(overrides) — para trigger tests
```

### Mock Strategy

| Dependency | Mock | File |
|-----------|------|------|
| `@upstash/qstash` Client | `mockPublishJSON` | `qstash.test.ts` |
| `@/lib/evolution-api` | `mockSendAdminGroupMessage` | `route.test.ts` |
| `@upstash/qstash/nextjs` | Passthrough handler | `route.test.ts` |
| `@/features/notifications/qstash` | `mockEnqueueAdminWhatsAppNotification` | `actions.test.ts` |

---

## 5. Quality Gates

| Gate | Criteria | Tool |
|------|----------|------|
| Unit tests pass | 7/7 testes verdes | `npm test` |
| Integration tests pass | 8/8 testes verdes | `npm test` |
| E2E tests pass | 3/3 verdes | `npx playwright test` |
| Lint | 0 warnings | `npm run lint` |
| TypeScript | 0 errors | `npm run type-check` |
| Memtrace QA | Dead code gate | `npm run qa:memtrace` |
| Regressions | `enqueueArtistClaimInvitation` intacta | Teste de regressão dedicado |

---

## 6. ATDD Checklist

- [x] **T1** `qstash.test.ts` — scaffold criado (4 testes)
- [x] **T2** `admin-whatsapp/route.test.ts` — scaffold criado (8 testes)
- [x] **T3** `collectives/actions.test.ts` — scaffold ATDD adicionado (2 testes)
- [x] **T4** `artists/actions.test.ts` — scaffold ATDD adicionado (1 teste)
- [x] **T5** `artists/actions.test.ts` — scaffold ATDD adicionado (1 teste)
- [ ] **T6** `.env.example` — documentação (cobertura manual)
- [x] **T7** Test design document — este documento
- [ ] **T8** Testes de regressão e qualidade — pós-implementação

**Total scaffolds gerados: 5 arquivos / ~16 testes vermelhos aguardando implementação.**

---

## 7. Non-Functional Requirements

| NFR | Assessment | Action |
|-----|-----------|--------|
| Performance | Fire-and-forget garante que Server Actions não são bloqueadas | Verificar que enqueue não tem `await` no caller |
| Reliability | QStash retry automático em falha do webhook | Garantir que webhook é idempotente |
| Security | `verifySignatureAppRouter` no webhook + Zod validation | Protege contra QStash spoofing |
| Observability | `console.info` no webhook + erro logado se Evolution falha | Garantir log estruturado |
