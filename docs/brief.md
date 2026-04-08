# Project Brief: agenda-clubber

> **Status:** Finalizado (Draft de Inteligência de Cena)
> **Versão:** 1.0
> **Responsável:** Atlas (Analyst) via Coletivo Ignis
> **Contexto Regional:** Ceará, Brasil

## 1. Sumário Executivo
`agenda-clubber` é uma plataforma web centralizada para a coordenação estratégica e fomento da cena de música eletrônica no Ceará. O objetivo é permitir que coletivos organizem seus calendários de forma colaborativa, evitando "choques de datas" e sobreposição de nichos (gêneros/artistas), enquanto centraliza recursos de infraestrutura (locais e serviços) e talentos.

## 2. Declaração do Problema
*   **Conflitos de Datas:** Eventos de estilos similares ocorrendo no mesmo dia fragmentam o público limitado, gerando prejuízos financeiros.
*   **Caos na Comunicação:** Grupos de WhatsApp e listas manuais são ineficientes para planejamento a longo prazo (2-6 meses).
*   **Fragmentação de Recursos:** Dificuldade para coletivos (especialmente novos) encontrarem artistas locais, locais para festas e fornecedores confiáveis.

## 3. Solução Proposta (Hub de Ecossistema)
Uma "Torre de Controle" da cena eletrônica com três pilares:
1.  **Calendário Inteligente:** Visualização estratégica de datas com detecção automática de conflitos por gênero e artista.
2.  **Diretório de Talentos:** Perfis de artistas (DJs, VJs, Lives) com sistema de "Reivindicação de Perfil" para autogestão de dados e links.
3.  **Mapa de Infraestrutura:** Cadastro de locais (Venues) e serviços (Som, Luz, Segurança) para facilitar a produção.

## 4. Usuários Alvo
*   **Primários (Coletivos):** Núcleos artísticos que alimentam a agenda e buscam coordenação.
*   **Secundários (Artistas):** Talentos do Ceará e de fora que buscam visibilidade e gestão de sua "agenda de interesse" para os produtores.
*   **Apoiadores (Venues e Serviços):** Donos de locais e fornecedores que buscam ocupação e contratos.

## 5. Escopo do MVP (Fase 1)
*   **Autenticação (Supabase):** Perfis para Coletivos e Artistas.
*   **Calendário de Coordenação:** Cadastro de eventos com status (Ideia, Planejamento, Confirmado).
*   **Motor de Conflitos:** Alertas de choque de Gênero/Data e Artista/Data.
*   **Módulo de Talentos:** Cadastro/Reivindicação de perfis de artistas com aprovação do Admin.
*   **Acesso Público:** Visualização de dados públicos de artistas e calendário de eventos confirmados.
*   **Governança:** Botão de denúncia para perfis fakes e arbitragem direta entre coletivos em caso de conflito.

## 6. Considerações Técnicas (Lean Architecture)
*   **Stack:** Next.js (Frontend/SEO) + Tailwind CSS + Supabase (PostgreSQL, Auth, Storage, Realtime).
*   **Hospedagem:** Vercel (Gratuito inicialmente).
*   **Segurança:** Row Level Security (RLS) para garantir que cada usuário edite apenas o que lhe pertence.
*   **Marca:** Independente (`agenda-clubber`), com endosso "Powered by Coletivo Ignis".

## 7. Premissas e Restrições
*   **Neutralidade:** A plataforma deve ser vista como um bem comum, protegendo dados de eventos não anunciados.
*   **Orçamento:** Foco total em ferramentas com tiers gratuitos generosos.
*   **Arbitragem:** Conflitos de datas são resolvidos via conversa direta entre os coletivos interessados.

## 8. Riscos e Perguntas Abertas
*   **Risco:** Baixa adesão inicial dos "grandes" coletivos.
*   **Risco:** Manutenção dos dados (perfis fakes ou desatualizados).
*   **Pergunta:** Como expandir para o resto do Nordeste sem perder a essência do foco local no Ceará?

---
*Documento gerado pelo Agente Atlas para fomento da cultura eletrônica cearense.*
