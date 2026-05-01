# Deferred Work & Débito Técnico

Issues adiadas deliberadamente para ciclos futuros. Cada entrada referencia um teste fixme ou observação.

---

## DEBT-3.2-A — Bio do Test DJ não visível em E2E (CI-only)

- **Detectado em:** Story 3.2, CI run 2026-05-01
- **Status:** `test.fixme` em `e2e/public-artist-profile.spec.ts:15`
- **Sintoma:** O texto `"Bio do Test DJ"` não é encontrado pelo Playwright no perfil público `/artists/test-dj`, enquanto `name`, `location` e `genre` da mesma página passam.
- **Hipóteses:**
  1. Seed corrompido por runs CI anteriores (registro "Test DJ" já existia com `privacy_mode=ghost` antes do seed)
  2. Race condition entre `Suspense` + `cacheComponents:true` e o render do campo bio
  3. Possível diferença entre `sql.json(DEFAULT_PRIVACY)` no client `postgres-js` e o tipo `jsonb` ao reaplicar via `ON CONFLICT DO UPDATE` — o `EXCLUDED.bio` pode ser `NULL` se o INSERT não veio com bio
- **Não-bloqueador da Story 3.2** — fluxo de perfil público não foi modificado neste ciclo
- **Investigação proposta (final do Épico 3):**
  - Adicionar `console.log` da resposta do `getPublicArtistBySlug('test-dj')` em CI para verificar se `bio` está `null` vs string
  - Adicionar `screenshot` no `afterEach` do teste fixme
  - Limpar tabela `artists` no início do `global-setup.ts` (`DELETE WHERE slug IN ('test-dj', ...)`) para garantir seed limpo a cada run
  - Considerar remover `Suspense` do `page.tsx` de `/artists/[slug]` (documentado in-deferred pelo autor original)

