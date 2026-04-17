# Relatório de Auditoria de Aceitação - Story 1.3

Aqui estão as descobertas da revisão do diff contra a especificação, focando nas violações dos Critérios de Aceite e desvios de intenção:

- **Título:** Upload de arquivos ausente (Foto de Perfil e Release PDF)
  **AC Violado:** AC 2 (Onboarding Form: Opcionais: Release (PDF), Foto de Perfil) e Task "Implement file upload for Profile Photo and Release PDF".
  **Evidência:** No componente `OnboardingForm` (`src/features/artists/components/onboarding-form.tsx`), não foram incluídos os inputs de arquivo para Foto de Perfil e Release. Consequentemente, o schema de validação (`artistOnboardingSchema`) e a server action (`saveArtistOnboardingAction`) no arquivo `src/features/artists/actions.ts` também não capturam nem processam o upload desses arquivos para o Supabase Storage, embora a task afirme que isso foi implementado.

- **Título:** Falta de validação Server-side para arquivos
  **AC Violado:** AC 4 (Validation: Server-side validation with Zod for all fields, including [...] file size/type for uploads).
  **Evidência:** O `artistOnboardingSchema` em `src/features/artists/actions.ts` valida perfeitamente as strings e URLs (Soundcloud, YouTube, etc.), mas não possui nenhuma validação implementada para tamanho ou tipo de arquivos (ex: tamanho máximo, `.pdf`, `.jpg`, etc.), devido à ausência do próprio upload no formulário.

- **Título:** Possível desvio da intenção na busca de perfis "on-the-fly"
  **AC Violado:** Intenção do AC 1 (Mandatory Search: force a search for existing "on-the-fly" profiles).
  **Evidência:** Em `src/features/artists/components/search-before-create.tsx`, a busca foi implementada, mas quando encontra um perfil existente ela bloqueia o fluxo de cadastro: `if (isDuplicate) { setError("Já existe um artista com este nome..."); }`. Se o conceito de perfil "on-the-fly" implica num perfil pré-criado por um produtor que o artista deveria reinvindicar (claim), o comportamento atual impede essa adoção e simplesmente barra o usuário de continuar. O diff não possui código para associar o usuário ao perfil existente caso a busca o encontre.
