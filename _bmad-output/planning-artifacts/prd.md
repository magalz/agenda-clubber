---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments: ["_bmad-output/planning-artifacts/product-brief-agenda-clubber.md", "music-genres/genres.md"]
workflowType: 'prd'
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
classification:
  projectType: 'web_app'
  domain: 'Music & Community Organizing'
  complexity: 'Medium'
  projectContext: 'greenfield'
status: 'complete'
completionDate: 'segunda-feira, 13 de abril de 2026'
---

# Product Requirements Document - Agenda Clubber

**Author:** magal
**Date:** segunda-feira, 13 de abril de 2026

## Executive Summary

O **Agenda Clubber** é um hub de coordenação logística e descoberta de talentos focado no ecossistema de música eletrônica do Nordeste brasileiro. O produto resolve a fragmentação e a ineficiência do planejamento manual (atualmente dependente de grupos de WhatsApp), eliminando o risco de "choques de datas" — eventos similares ocorrendo simultaneamente que canibalizam o público e prejudicam a sustentabilidade financeira dos coletivos. A plataforma atua como uma camada de inteligência e confiança, permitindo que produtores planejem datas com antecedência de 30 dias através de uma lógica visual de cores de impacto (Verde, Amarelo e Vermelho), incentivando a comunicação direta e a união da cena.

### What Makes This Special

O diferencial do Agenda Clubber reside na **automação da consciência coletiva**. Diferente de calendários genéricos, ele oferece um sistema de detecção de conflitos personalizado que considera não apenas a data, mas o estilo musical e o line-up, notificando proativamente os envolvidos sobre riscos críticos. Além disso, democratiza o acesso a talentos regionais através de um banco de dados de artistas com presskits integrados e um sistema de "reivindicação de perfil" que empodera o artista na gestão de sua própria carreira. A infraestrutura é desenhada para ser *always free* e de baixo custo, utilizando tecnologia moderna para oferecer uma organização que o fator humano sozinho não conseguiu sustentar nos últimos anos.

## Project Classification

*   **Project Type:** Web App (SaaS Comunitário)
*   **Domain:** Music & Community Organizing
*   **Complexity:** Medium (Lógica customizada de conflitos + Integração de Bots)
*   **Project Context:** Greenfield (Desenvolvimento do zero)

## Success Criteria

### User Success

*   **Produtores:** Obter visibilidade instantânea (menos de 5 segundos) de conflitos em uma janela de 30 dias ao planejar um evento, permitindo decisões baseadas em dados antes do anúncio oficial.
*   **Artistas:** Centralizar presskits e contatos em um hub profissional, sendo descobertos e contatados por novos coletivos regionais através da plataforma.

### Business Success

*   **Adoção Crítica:** Alcançar 15 coletivos ativos em Fortaleza nos primeiros 3 meses, representando a quase totalidade da cena atual.
*   **Impacto na Cena:** Redução drástica e mensurável no número de eventos com "choque crítico" (mesmo estilo/público no mesmo final de semana) cadastrados na plataforma.

### Technical Success

*   **Confiabilidade de Notificação:** Garantir que 100% dos alertas de choque crítico sejam entregues via e-mail (obrigatório) e, idealmente, via bot de WhatsApp (desejável) para os produtores envolvidos.
*   **Integridade de Dados:** Sistema robusto de aprovação manual e reivindicação de perfil que impeça duplicatas e perfis falsos, mantendo a "cozinha" dos eventos protegida.

### Measurable Outcomes

*   **Taxa de Resolução de Conflitos:** % de eventos que alteraram a data ou line-up após um alerta de choque crítico.
*   **Crescimento da Base de Artistas:** Número de artistas com perfis "Reivindicados" vs. perfis "Criados on-the-fly".

## Product Scope

### MVP - Minimum Viable Product

*   **Core Logic:** Calendário com lógica de conflitos visual (Verde, Amarelo, Vermelho) baseado em data, estilo musical e artistas.
*   **User Management:** Sistema de Login e Cadastro com aceite obrigatório de Termos de Confidencialidade e aprovação administrativa.
*   **Artist Hub:** Cadastro de artistas com fluxo de busca prévia para incentivar o Claim (Reivindicação).
*   **Notifications:** Alertas automáticos de choque via e-mail e integração inicial com Bot de WhatsApp para avisos administrativos.
*   **Admin Dashboard:** Painel para aprovações e gestão da base de dados.

### Growth Features (Post-MVP)

*   **Histórico de Cena (Data Ingestion):** Funcionalidade para produtores cadastrarem eventos passados (pré-plataforma) para alimentar dashboards de inteligência.
*   **Market Intelligence Dashboard:** Um painel público com estatísticas agregadas da cena (eventos por estilo, total de público estimado).
*   **Bot no Grupo de Produtores:** Automação de avisos de novos eventos diretamente no grupo de WhatsApp da comunidade.
*   **Links Externos:** Integração de links de venda de ingressos (redirecionamento) e redes sociais.

### Vision (Future)

*   **Agenda Pública:** Portal para o público final consultar eventos confirmados sem necessidade de login.
*   **Hub de Prestadores de Serviço:** Cadastro e busca de profissionais técnicos (som, luz, cenografia).
*   **Expansão Regional:** Suporte para múltiplos estados e países, com filtros de localidade inteligentes.

## User Journeys

### 1. O Produtor (Lucas - Coletivo Ignis) - Planejamento Proativo
**Cenário:** Lucas está organizando uma noite de Techno em Fortaleza. Ele quer o dia 15 de Julho, mas sabe que a comunicação via WhatsApp é falha.
**Ação:** Lucas acessa o Agenda Clubber e tenta cadastrar seu evento. Ao selecionar a data e o estilo musical (Techno), o sistema sinaliza um **Alerta Vermelho** (Choque Crítico). O Coletivo X já tem um evento de Techno no mesmo final de semana.
**Resolução:** Lucas clica no perfil do Coletivo X, encontra o contato direto e liga para o produtor. Eles negociam e Lucas move sua data para o dia 22 (Sinal Verde).
**Impacto:** Ambos os eventos ocorrem com público máximo e a cena permanece unida.

### 2. O Artista Iniciante (Marina - DJ de House) - Descoberta de Talentos
**Cenário:** Marina é uma DJ talentosa de House, mas sente dificuldade em ser notada por coletivos fora do seu círculo imediato.
**Ação:** Marina acessa a página de cadastro. O sistema a orienta a buscar seu nome primeiro. Como não encontra, ela cria seu perfil, sobe seu presskit digital, releases e links.
**Resolução:** Um coletivo do interior do estado (Sobral) busca por artistas de House no Hub, encontra o perfil de Marina e entra em contato para contratá-la.
**Impacto:** Marina expande sua carreira regionalmente e o coletivo descobre um talento novo.

### 3. O Administrador (Gestão de Confiança) - Curadoria e Integridade
**Cenário:** Um novo usuário se cadastra como "Coletivo Y", aceitando os termos de sigilo, mas os dados parecem suspeitos.
**Ação:** O sistema notifica o admin via WhatsApp. O administrador analisa o perfil e verifica a autenticidade antes de liberar o acesso estratégico ao calendário.
**Resolução:** O administrador reprova o cadastro após confirmar que os dados eram falsos.
**Impacto:** A plataforma mantém sua integridade como um ambiente seguro e exclusivo para profissionais.

### 4. O Artista "On-the-Fly" (DJ Zé - Reivindicação de Perfil) - Soberania de Dados
**Cenário:** O DJ Zé é citado em um evento criado pelo Coletivo Ignis. O produtor adiciona dados básicos para completar o line-up.
**Ação:** O sistema gera o perfil do DJ Zé, mas exibe publicamente apenas seu Nome e Localidade. Os demais dados inseridos ficam privados. Zé recebe um e-mail para "Reivindicar sua Página".
**Resolução:** Zé faz o Claim, libera a visibilidade dos seus links sociais e passa a gerenciar sua imagem na plataforma.
**Impacto:** A base de dados cresce com privacidade garantida e os artistas tornam-se donos de suas informações.

### Journey Requirements Summary
*   **Gestão de Conflitos:** Lógica de impacto (cores) multidimensional.
*   **Hub de Artistas:** Fluxo de Onboarding com pesquisa prévia e privacidade diferencial para perfis não reivindicados.
*   **Notificações & Bots:** Integração híbrida E-mail/WhatsApp.
*   **Segurança e Acesso:** Aceite de Termos de Uso (Legal Binding) e aprovação manual.

## Domain-Specific Requirements

### Taxonomia Musical Hierárquica
*   **Seleção Obrigatória:** Ao menos um gênero principal.
*   **Subgêneros Opcionais:** Detalhamento para relatórios futuros.

### Inteligência de Localidade & Tempo
*   **Padronização de Backend:** Conversão para UTC.
*   **Fuso Horário Automático:** Via API de Mapas.

### Privacidade e Confidencialidade
*   **Termos de Uso:** Aceite obrigatório de cláusula de sigilo sobre dados de planejamento durante o cadastro do coletivo.
*   **Privacidade "On-the-fly":** Artistas criados por terceiros exibem publicamente apenas Nome e Localidade. Dados sensíveis (contatos, notas internas) permanecem privados até o Claim do artista.
*   **Anonimidade Granular:** Opção de ocultar local/line-up durante a fase de planejamento.

## Innovation & Novel Patterns

### Algoritmo de Detecção de Choque (v1.2)
*   **VERMELHO (Crítico):** Mesmo gênero em janela de **3 dias**. Mesmo artista não-local em **7 dias**. 3+ artistas locais na mesma data.
*   **AMARELO (Médio):** Mesmo gênero em janela de **4 a 7 dias**. Mesmo artista não-local em **8 a 15 dias**. 2 artistas locais na mesma data.
*   **VERDE (Saudável):** Resolução bilateral, gêneros diferentes ou janelas > 15 dias.

### Mecanismos de Confiança & Bots
*   **Aprovação Curada:** Filtro humano via Bot de WhatsApp.
*   **Claim Educativo:** O onboarding de artistas desencoraja duplicatas através de uma busca obrigatória e avisos sobre perfis pré-existentes.

## Functional Requirements

### Gestão de Identidade e Acesso
*   **FR1:** Usuários podem se cadastrar como Artista, Coletivo ou ambos, com aceite obrigatório de Termos de Uso e Confidencialidade.
*   **FR2:** Administradores podem aprovar/reprovar cadastros via Dashboard.
*   **FR3:** Administradores do Coletivo podem convidar membros via e-mail.
*   **FR4:** O sistema deve restringir planejamento a coletivos aprovados.
*   **FR5:** Usuários podem realizar login/logout seguro.

### Gerenciamento de Coletivos
*   **FR6:** Coletivos podem editar seu perfil e estilos musicais.
*   **FR7:** Coletivos possuem um Dashboard privado com eventos e notificações.

### Hub de Artistas e Presskits
*   **FR8:** Base de dados pública de Artistas exibindo perfis completos (reivindicados) ou restritos (on-the-fly).
*   **FR9:** No cadastro de artista, o sistema deve obrigar uma busca prévia para verificar se o perfil já foi criado "on-the-fly", apresentando a opção de "Claim" em vez de novo cadastro.
*   **FR10:** Busca de artistas por nome, gênero ou localidade.
*   **FR11:** Coletivos podem criar perfis de artistas "on-the-fly", mantendo apenas Nome e Localidade como dados públicos.
*   **FR12:** Artistas podem reivindicar perfis via validação administrativa.
*   **FR13:** Indexação de perfis para SEO.

### Planejamento de Eventos e Calendário
*   **FR14:** Visualização de calendário consolidado.
*   **FR15:** Cadastro de eventos (data, local, gênero, line-up).
*   **FR16:** Status de evento: "Em Planejamento" ou "Confirmado".
*   **FR17:** Opção de anonimidade para local exato ou line-up em planejamento.
*   **FR18:** Sincronização em tempo real e sistema de "lock" temporário no cadastro de datas.
*   **FR19:** Usuários podem marcar um conflito como "Resolvido" (ação bilateral).
*   **FR20 (Post-MVP):** Coletivos podem ingerir dados de eventos históricos passados para alimentar o dashboard de saúde da cena.

### Lógica de Inteligência de Conflitos (Algoritmo v1.2)
*   **FR21:** Cálculo automático de impacto (Verde/Amarelo/Vermelho).
*   **FR22:** Exibição de justificativas para alertas Amarelos e Vermelhos.
*   **FR23:** Delay de 3 segundos para confirmação em conflitos Vermelhos com mensagem explicativa sobre consciência coletiva.
*   **FR24:** Captura automática de geolocalização e fuso horário via API de Mapas.

### Notificações e Automação
*   **FR25:** Envio de e-mails instantâneos para conflitos Vermelhos.
*   **FR26:** Notificação via WhatsApp para admins sobre cadastros pendentes.
*   **FR27:** Notificação via e-mail para artistas em perfis criados "on-the-fly".

## Non-Functional Requirements

### Performance
*   **Response Time:** Cálculo de conflitos < 2 segundos.
*   **Sincronização:** Reserva de datas refletida em < 5 segundos.

### Segurança e Privacidade
*   **Proteção de Dados:** Criptografia TLS e AES-256.
*   **Privacidade de Onboarding:** Dados privados de artistas "on-the-fly" são ocultados do público até a reivindicação.
*   **Controle de Acesso:** Modelo RBAC rigoroso.
*   **Audit Log:** Registro de criação e edições de eventos.

### Escalabilidade
*   **Volume de Usuários:** 30 coletivos inicialmente, escalando para 50+ em um ano.
*   **Gestão de Carga:** Infraestrutura dimensionada para tráfego profissional constante.

### Confiabilidade
*   **Disponibilidade (Uptime):** Alvo de 99.5%.
