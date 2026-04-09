# UI Standards: agenda-clubber

> **Status:** Active
> **Versão:** 1.0
> **Responsável:** Aria (Architect)
> **Tema:** Industrial Dark Mode (Ceará Scene Edition)

---

## 1. Conceito Visual
O `agenda-clubber` deve evocar a atmosfera de galpões, espaços industriais e a cultura de rua do Ceará. A estética é **crua, funcional e técnica**, utilizando contrastes altos e tipografia mecânica.

### Palavras-Chave
- Brutalismo Industrial
- Visibilidade Noturna
- Funcionalidade Pragmática
- Contraste Urbano

---

## 2. Paleta de Cores (Industrial Dark)
Baseada na escala de cinzas profundos com acentos vibrantes de "alerta".

| Camada | Cor (Hex/Tailwind) | Uso |
| :--- | :--- | :--- |
| **Fundo Principal** | `#0A0A0A` (`bg-neutral-950`) | Superfícies base, imersão total. |
| **Superfície Secundária** | `#171717` (`bg-neutral-900`) | Cards, modais, seções destacadas. |
| **Bordas/Grades** | `#262626` (`border-neutral-800`) | Divisores, grids técnicos. |
| **Texto Primário** | `#EDEDED` (`text-neutral-100`) | Leitura principal, títulos. |
| **Texto Secundário** | `#A3A3A3` (`text-neutral-400`) | Metadados, labels, descrições. |
| **Acento (Alerta)** | `#FACC15` (`text-yellow-400`) | CTAs, ícones de status, avisos de conflito. |
| **Acento (Ação)** | `#3B82F6` (`text-blue-500`) | Links, botões de ação secundária. |

---

## 3. Tipografia
Foco em legibilidade em ambientes de baixa luminosidade.

-   **Headings (Títulos):** `Inter` ou `Geist Mono` (Semibold/Bold). Use `uppercase` para títulos de seção para um ar mais industrial/técnico.
-   **Body (Corpo):** `Inter` (Regular). Espaçamento entre linhas generoso (`leading-relaxed`).
-   **Monospace:** `Geist Mono`. Use para IDs de eventos, datas técnicas e metadados do sistema.

---

## 4. Componentes e Layout
-   **Grids:** Use grids visíveis (bordas de 1px) para separar seções, simulando esquemas técnicos.
-   **Border Radius:** Raio pequeno (`rounded-sm` ou `rounded-md`). Evite componentes muito arredondados para manter a estética industrial.
-   **Buttons:**
    -   *Primary:* Fundo Amarelo, texto Preto (`bg-yellow-400 text-black hover:bg-yellow-500`).
    -   *Secondary:* Borda Cinza, sem fundo (`border border-neutral-800 hover:bg-neutral-900`).
-   **Status Indicators:**
    -   `Ideia`: Tracejado (`border-dashed`).
    -   `Planejamento`: Linha sólida cinza.
    -   `Confirmado`: Borda sólida amarela com brilho sutil.

---

## 5. Iconografia
Use ícones de linha fina (ex: Lucide React) com pesos consistentes (`stroke-width: 1.5`).
-   **Conflitos:** Sempre acompanhados do ícone de `AlertTriangle` em Amarelo.

---

## 6. Feedback Visual (Interatividade)
-   **Hover:** Mudança sutil de cor de fundo ou brilho na borda.
-   **Transições:** Rápidas (`duration-150`) e lineares. O sistema deve parecer "rápido e mecânico".

---
*Aria, arquitetando o futuro 🏗️*
