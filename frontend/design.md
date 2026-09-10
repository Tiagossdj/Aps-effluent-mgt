# Design System — Dashboard de Conformidade de Efluentes

Fonte da verdade: componentes exportados do Lovable em `/design-reference/`.
Este arquivo documenta os tokens em texto para consulta rápida — não redefina
cores ou valores aqui sem checar contra `/design-reference/src/styles.css`.

## Paleta (formato oklch, Tailwind v4 via `@theme inline`)

| Token | Hex aproximado | Uso |
|---|---|---|
| `--background` | #0B132B | fundo principal |
| `--surface` / `--card` | #1C2541 | cards, superfícies elevadas |
| `--secondary` / `--muted` | #3A506B | bordas, divisores, texto de apoio |
| `--primary` / `--accent` | #5BC0BE | destaque, ação, status "conforme" |
| `--foreground` | #F4F1DE | texto principal |
| `--destructive` | vermelho (alerta crítico) | não conformidade |
| `--warning` | laranja (alerta) | atenção |

Nunca usar hex literal em componentes — sempre a variável CSS/token Tailwind
(ex: `bg-card`, `text-foreground`, `text-destructive`).

## Tipografia
- Sans: `Manrope`
- Mono (valores numéricos/técnicos): `JetBrains Mono`

## Radius
Base `--radius: 0.875rem`, com escala `sm/md/lg/xl/2xl` derivada. Usar
`rounded-xl` como padrão de cards.

## Componentes de referência (em `/design-reference/src/components/dashboard/`)
- `topbar.tsx` — nome da organização, seletor de período, badge de status geral
- `sidebar-nav.tsx` — navegação lateral colapsável
- `kpi-cards.tsx` — grid de 4 KPIs
- `trend-chart.tsx` — gráfico de linha (recharts) com linha de limite CONAMA
- `alerts-feed.tsx` — feed de não conformidades recentes
- `analyses-table.tsx` — tabela de análises
- `parameter-cards.tsx` — mini-gauge por parâmetro
- `test-data-dialog.tsx` — dialog de inserção de dado de teste (mock atual)

Ao recriar cada tela no Next.js, adapte a estrutura desses componentes —
não redesenhe do zero.