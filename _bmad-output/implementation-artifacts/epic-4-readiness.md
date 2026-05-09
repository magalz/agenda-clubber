# Epic 4 Readiness — Mapa de Bloqueadores e Pré-requisitos

**Status:** 🔴 NÃO INICIAR — fase de preparação obrigatória em andamento
**Documento canônico:** Use este doc como fonte de verdade para o que precisa acontecer antes do Épico 4.
**Última atualização:** 09/05/2026 (pós-retro Épico Housekeeping)

---

## 1. Decisões de Produto (Pendentes)

### DP1 — Eventos cross-visible no grid?
- **Pergunta:** Eventos com pelo menos 1 flag pública aparecem mascarados no grid? 100% privados invisíveis?
- **Impacto:** 🔴 Bloqueador para Story 4.1 (Sheet só funciona se você VÊ o evento conflitante) e Story 4.4 (Resolução bilateral exige ambos verem)
- **Default proposto:** SIM — eventos com pelo menos 1 flag pública aparecem mascarados; privados ficam invisíveis
- **Resolver via:** `bmad-correct-course`

### DP2 — Engine considera eventos 100% privados?
- **Pergunta:** Engine considera todos eventos, mas só notifica se há flag pública?
- **Impacto:** 🔴 Bloqueador para Story 4.2 (Email pra "ambos coletivos" — se evento é privado, notifica?)
- **Default proposto:** SIM — engine considera todos, notificação respeita privacidade
- **Resolver via:** `bmad-correct-course`

### DP3 — Gênero do coletivo como proxy de conflito?
- **Decisão:** 🟢 **ADiADO** — fica para v2. Fora do MVP do Épico 4.

### DP4/DP5 — Justificativa revela fonte (qual evento causou)?
- **Pergunta:** Justificativa revela fonte com níveis: anônimo (todas flags off), parcial (1-2 flags on), completo (3 flags on)?
- **Impacto:** 🔴 Bloqueador para Story 4.1 (Sheet precisa identificar o evento conflitante)
- **Nota:** DP4 e DP5 são duplicatas — DP5 fechada como duplicata de DP4.
- **Default proposto:** SIM — 3 níveis de revelação progressiva, consistente com `filterEventForViewer` existente
- **Resolver via:** `bmad-correct-course`

---

## 2. Story 4.1 — Sheet de Conflitos com WhatsApp/Instagram

| Pré-requisito | Estado | Severidade |
|---------------|--------|------------|
| Campo `whatsapp_phone` ou `phone` no schema de collectives | ❌ Não existe. Só `socialLinks` jsonb genérico (soundcloud, youtube, instagram) | 🔴 Bloqueador de schema |
| Decisão UX: sheet novo ou reusar DayDetailSheet? | ❌ Não definido | 🟡 Decisão arquitetural |
| DP1 (cross-visible) resolvido | ❌ Aberto | 🔴 Bloqueador de produto |
| DP4 (revelar fonte) resolvido | ❌ Aberto | 🔴 Bloqueador de produto |

### Ações necessárias
1. Decidir: `whatsapp_phone` como campo dedicado (tipado, query-friendly, E.164) vs `socialLinks.whatsapp` (flexível, sem typing)
2. Migration adicionando campo ao schema
3. Resolver DP1 e DP4 via `bmad-correct-course`

---

## 3. Story 4.2 — Email Notifications

| Pré-requisito | Estado | Severidade |
|---------------|--------|------------|
| D9 — Resend integration | ❌ TODO ativo: `"replace stub with Resend/transactional provider integration"` em `webhooks/notifications/artist-claim/route.ts:28` | 🔴 Bloqueador técnico |
| QStash funcional (envia → consome) | ✅ Já tem (Story 2.1) | ✅ OK |
| DP2 (notificar conflito com evento privado?) | ❌ Aberto | 🔴 Bloqueador de produto |

### Ações necessárias
1. **Spike pré-4-1**: Resend integration — substituir stub QStash → Resend, padronizar template de email transacional
2. Resolver DP2 via `bmad-correct-course`

---

## 4. Story 4.3 — Evolution API / Admin WhatsApp Group

| Pré-requisito | Estado | Severidade |
|---------------|--------|------------|
| Evolution API instance/host | ❌ Zero infraestrutura. Sem mention no código, sem env var | 🔴 Bloqueador (spike completo) |
| Admin WhatsApp Group ID configurado | ❌ Não existe | 🔴 Bloqueador |
| Custo Evolution API (self-host ou SaaS) | ❌ Não avaliado | 🟡 Decisão de produto/financeira |

### Ações necessárias
1. **Spike pré-4-2**: Evolution API — setup ambiente dev (requer Docker container), validar deep link Group + send message
2. Decidir self-host vs SaaS
3. Configurar env vars

---

## 5. Story 4.4 — Resolução Bilateral Consensual

| Pré-requisito | Estado | Severidade |
|---------------|--------|------------|
| Conflitos persistidos no DB (com status mutável) | ❌ Hoje compute-on-write (Q5). Status mutual exigiria `event_conflicts` table ou coluna nova | 🔴 Bloqueador de schema |
| Status `consensual_agreement` novo | ❌ Schema atual só tem `planning` / `confirmed` em events; não há concept de "conflict resolution status" | 🔴 Bloqueador de schema |
| Realtime cross-collective (D24) | ❌ Deferido no Épico 3 | 🟡 Pode ficar pra v2 |

### Ações necessárias
1. **Spike pré-4-3**: Conflict persistence model — decidir `event_conflicts` table com status, vs flag em events
2. Migration definida
3. Resolver DP1 (ambos precisam ver o conflito para resolvê-lo)

---

## 6. Fase de Preparação — Ordem Recomendada

```
Fase 0a — Produto:  bmad-correct-course resolve DP1, DP2, DP4
Fase 0b — Schema:   decidir whatsapp_phone (dedicated vs jsonb)
Fase 0c — Tooling:  decidir Evolution API (self-host vs SaaS)
                     ↓
Fase 1 — Spikes técnicas (4 spikes, podem rodar em paralelo com Fase 0):
  Spike 1: Resend integration (D9)
  Spike 2: Evolution API setup
  Spike 3: Conflict persistence model
  Spike 4: WhatsApp schema migration
                     ↓
Fase 2 — Atualizar PRD/epics.md com base nas spikes
                     ↓
Fase 3 — Épico 4 começa: Story 4.1
```

---

## 7. Referências

- Retro doc: `epic-housekeeping-retro-2026-05-08.md` (Seção 6)
- Sprint-status: `sprint-status.yaml` (entradas `epic-4-readiness` / `pre-4-*`)
- Tech debt: GitHub Issues #39-#69 (labels: `tech-debt`, `decision-pending`)
- Decisões de produto: Issues DP1 (#65), DP2 (#66), DP4 (#68)
