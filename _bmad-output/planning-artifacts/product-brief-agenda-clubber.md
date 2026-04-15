# Product Brief: Agenda Clubber

## Executive Summary
O **Agenda Clubber** é uma plataforma comunitária desenhada para organizar e fortalecer o ecossistema de música eletrônica de Fortaleza (e futuramente do Ceará e além). Em um cenário de crescimento acelerado pós-pandemia, o projeto resolve a desorganização crônica causada pelo planejamento fragmentado em grupos de WhatsApp, que frequentemente resulta em "choques de datas" — eventos similares ocorrendo no mesmo dia e canibalizando o público limitado de 200 a 600 pessoas.

A solução atua como a "espinha dorsal" da cena, integrando um **Calendário Inteligente de Planejamento** com detecção de conflitos em tempo real e um **Hub de Talentos** (Artistas e Prestadores de Serviço). O objetivo é garantir que cada coletivo possa prosperar sem prejudicar o vizinho, promovendo uma cultura de colaboração técnica e estratégica que beneficia produtores, artistas e o público final.

## The Problem
Atualmente, a coordenação de datas em Fortaleza depende de mensagens editadas manualmente no WhatsApp. Esse modelo falha por três motivos principais:
1. **Invisibilidade e Descentralização:** Nem todos os coletivos estão no "grupo oficial", e novos produtores surgem sem canais de comunicação estabelecidos.
2. **Conflito de Interesses Não Intencional:** Coletivos com o mesmo nicho musical ou artistas em comum agendam festas na mesma data por falta de transparência, resultando em prejuízo financeiro e enfraquecimento da cena.
3. **Dificuldade de Contratação:** Existe um "gap" de informação para encontrar artistas locais ou regionais (Norte/Nordeste) e prestadores de serviço (som, luz, cenografia), forçando os produtores a dependerem de indicações informais ou bases de dados desatualizadas.

## The Solution
O Agenda Clubber centraliza o ecossistema em três pilares:
*   **Gestão de Datas (Anti-Choque):** Um sistema onde coletivos aprovados cadastram eventos em fase de "Planejamento" ou "Final". Ao selecionar uma data, o sistema analisa automaticamente o mês (janela de 30 dias) e sinaliza visualmente o risco de choque (Verde/Amarelo/Vermelho) com base em estilo musical, artistas e proximidade.
*   **Hub de Artistas e Reivindicação de Perfil:** Uma base de dados pública com presskits e contatos, alimentada por artistas e produtores. Artistas podem "reivindicar" perfis criados automaticamente para gerenciar sua própria imagem e agenda.
*   **Ecossistema de Confiança:** Um fluxo de aprovação rigoroso mediado por administradores e integrado ao WhatsApp (via bots), garantindo que apenas atores legítimos da cena tenham acesso a informações estratégicas de planejamento.

## What Makes This Different
Diferente de plataformas globais de venda de ingressos ou redes sociais, o Agenda Clubber foca na **"cozinha" do evento**.
*   **Foco na Colaboração Proativa:** O sistema não apenas lista eventos, mas incentiva o contato direto entre coletivos quando um choque é detectado.
*   **Always Free & Community-First:** Sem barreiras financeiras para entrada, construído para ser sustentável com baixo custo operacional (Next.js/Supabase).
*   **Inteligência de Localidade:** Nascido da dor específica de Fortaleza, mas com arquitetura preparada para escalar globalmente, respeitando as nuances de cada cena regional.

## Who This Serves
*   **Coletivos e Produtoras (Primário):** Buscam previsibilidade, facilidade na contratação e proteção de suas datas.
*   **Artistas (Primário):** Buscam visibilidade, profissionalização do seu presskit e uma ponte direta com contratantes.
*   **Prestadores de Serviço (Secundário - Fase Futura):** Buscam centralizar a oferta de seus serviços técnicos para a cena.
*   **Público Geral (Secundário - Fase Futura):** Busca uma agenda unificada e confiável para saber "o que está rolando na cidade".

## Success Criteria
*   **Adoção dos "Top 10" Coletivos de Fortaleza:** O sistema só funciona se os principais nomes da cena o utilizarem como fonte da verdade.
*   **Redução de Choques "Vermelhos":** Queda no número de eventos de mesmo estilo ocorrendo no mesmo final de semana.
*   **Crescimento da Base de Artistas Reivindicados:** % de perfis que saíram do estado "on-the-fly" para "gerenciado pelo artista".
*   **Engajamento Admin:** Tempo de resposta para aprovações via bot de WhatsApp inferior a 24h.

## Scope (Phase 1)
*   **In:** Cadastro/Login (Coletivo/Artista/Admin), Gestão de Coletivos, Dashboard de Planejamento com cores de choque, Notificações de choque via WhatsApp/E-mail, Base de Dados de Artistas Pública, Sistema de Claim (Reivindicação), Bot de Notificação para Admins.
*   **Out:** Venda de Ingressos (a plataforma focará apenas em redirecionamento para links externos de venda em fases futuras), Cadastro de Prestadores de Serviço, Agenda Pública para o consumidor final (Fase 2).

## Vision
Em 3 anos, o Agenda Clubber será o padrão ouro para coordenação de cenas eletrônicas em cidades de médio e grande porte ao redor do mundo. O que começou como uma solução para o "gap" de Fortaleza se tornará uma ferramenta global de inteligência cultural, permitindo que qualquer cidade crie seu próprio Hub e proteja sua diversidade musical através da tecnologia.
