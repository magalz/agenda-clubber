---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-atdd-scaffolds']
lastStep: 'step-02-atdd-scaffolds'
lastSaved: '2026-05-12'
storyId: '4.3'
storyKey: '4-3-notificacoes-admin-via-whatsapp-group'
storyFile: '_bmad-output/implementation-artifacts/4-3-notificacoes-admin-via-whatsapp-group.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-4-3-notificacoes-admin-via-whatsapp-group.md'
generatedTestFiles:
  - 'src/features/notifications/qstash.test.ts'
  - 'src/app/api/webhooks/notifications/admin-whatsapp/route.test.ts'
  - 'src/features/collectives/actions.test.ts'
  - 'src/features/artists/actions.test.ts'
testDesignDocument: '_bmad-output/test-artifacts/test-design/story-4-3-whatsapp-admin.md'
---

# ATDD Checklist — Story 4.3

## Scaffolds Generated (Red Phase)

### 1. `src/features/notifications/qstash.test.ts`
- [ ] U1: publishJSON with correct URL and payload → `{ queued: true }`
- [ ] U2: QSTASH_TOKEN not configured → error
- [ ] U3: NEXT_PUBLIC_SITE_URL not configured → error  
- [ ] U4: QStash rejection → error

### 2. `src/app/api/webhooks/notifications/admin-whatsapp/route.test.ts`
- [ ] I1: Valid collective payload → 200 + sendAdminGroupMessage called
- [ ] I2: Valid artist payload → message contains "Cadastro de Artista"
- [ ] I3: Valid claim payload → message contains "Reivindicação de Perfil"
- [ ] I4: Invalid type → 400
- [ ] I5: Missing name → 400
- [ ] I6: sendAdminGroupMessage fails → 500
- [ ] I7: Invalid JSON body → 400

### 3. `src/features/collectives/actions.test.ts`
- [ ] T3: enqueueAdminWhatsAppNotification called after collective insert with pending_approval
- [ ] T3: enqueue NOT called if DB insert fails

### 4. `src/features/artists/actions.test.ts`
- [ ] T4: enqueueAdminWhatsAppNotification called after on-the-fly artist creation
- [ ] T5: enqueueAdminWhatsAppNotification called after claim → pending_approval

## Implementation Handoff

After ATDD approval, implementation tasks:
1. Add `enqueueAdminWhatsAppNotification` to `qstash.ts`
2. Create `admin-whatsapp/route.ts` webhook consumer
3. Add `formatAdminNotificationMessage` to `evolution-api.ts`
4. Wire trigger in `createCollectiveAction`
5. Wire trigger in `createOnTheFlyArtistAction`
6. Wire trigger in `claimArtistProfileAction`
7. Update `.env.example`
