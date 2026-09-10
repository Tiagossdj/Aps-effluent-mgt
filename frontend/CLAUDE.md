# Contexto — Frontend (Next.js) — Dashboard de Conformidade de Efluentes

## Papel deste projeto
Cliente que consome a API REST do backend Fastify. Não contém lógica de
negócio, não calcula conformidade — apenas exibe o que a API retorna.

## Forma de trabalho (obrigatório)
- Trabalhe em uma fase por vez, nunca implemente o projeto inteiro de uma vez.
- Antes de iniciar cada fase: explique o objetivo, liste arquivos a
  criar/alterar, identifique decisões pendentes ou dependências (ex.: cor,
  componente de referência, endpoint ainda não confirmado).
- Se uma informação necessária não estiver definida neste arquivo ou em
  `design.md`, PARE e pergunte — não invente layout, cor, endpoint ou
  comportamento.
- Não deixe código temporário, mock ou TODO na implementação definitiva.
- Commits: Conventional Commits **100% em inglês — título e corpo, sem
  exceção**. Uma mudança lógica por commit, não comite automaticamente por
  edição pequena.
- Primeiro apresente o plano de fases completo e aguarde minha confirmação
  antes de implementar a primeira fase.

## Origem do design
Este projeto está sendo migrado de um protótipo gerado no Lovable
(TanStack Start + Vite). Os componentes de referência estão em
`/design-reference/` (não editar, só consultar) — ver `design.md` para os
tokens de design.

Ao recriar um componente, adapte a estrutura/classes Tailwind já existentes
em `/design-reference/src/components/dashboard/` para o App Router do
Next.js. Não invente layout, cor ou espaçamento que não esteja documentado
em `design.md` ou no código de referência.

## Arquitetura
- Next.js App Router.
- Sem Server Actions fazendo papel de backend — toda chamada de negócio usa
  `fetch` contra a API Fastify (`NEXT_PUBLIC_API_URL`).
- Route Handlers (`app/api/.../route.ts`) só como proxy leve, se necessário
  (ex: esconder alguma configuração) — nunca com regra de negócio.
- Estrutura sugerida:
```
app/
  layout.tsx
  page.tsx                 # dashboard principal
components/
  dashboard/                # adaptado de /design-reference
  ui/                       # shadcn/ui
lib/
  api-client.ts             # funções fetch tipadas para cada endpoint
  types.ts                  # tipos espelhando o contrato da API
```

## Padrão de dados assíncronos por seção (fixado na Fase 2)
Cada bloco do dashboard que busca dado da API (`KpiCards`, e a partir da
Fase 3 também parameter cards, trend chart, alerts feed e analyses table)
segue este padrão, para que a falha ou lentidão de um endpoint não
derrube nem trave o dashboard inteiro:

- Um Server Component "`*-section.tsx`" por bloco, responsável só por
  chamar a função de `lib/api-client.ts` e tratar erro — nunca faz fetch
  direto, sempre via `lib/api-client.ts`.
- O componente de apresentação (`kpi-cards.tsx`, etc.) recebe os dados já
  buscados/formatados via props — não sabe de onde vieram.
- Em `page.tsx`, cada seção fica dentro do seu próprio `<Suspense
  fallback={<XSkeleton />}>` — loading isolado por bloco, não um
  `loading.tsx` de rota inteira.
- Erro de fetch (`ApiError` ou qualquer outro) é capturado com `try/catch`
  dentro do próprio `*-section.tsx` e renderizado como mensagem inline no
  card — nunca propagado para um `error.tsx` de rota, que apagaria o
  dashboard inteiro por causa de um único endpoint fora do ar.

## Contrato de dados esperado da API (ver CLAUDE.md do backend)
- `GET /parameters` → lista dos 6 parâmetros com limites
- `GET /analyses?days=7|30|90` → lista de análises no período (obrigatório, sem default)
- `GET /series?param=<key>&days=7|30|90` → série temporal para o gráfico (obrigatório)
- `GET /kpis?days=7|30|90` → total, % conformidade, alertas, última coleta (obrigatório)
- `GET /alerts?days=7|30|90` → não conformidades recentes (obrigatório)
- `POST /analyses` → registrar nova análise (bloqueado em produção — ver abaixo)
- `POST /compliance/preview` → avalia conformidade sem persistir (usado na tela de teste pública)

Todos os parâmetros `days` são obrigatórios (400 se ausente ou fora de
7/30/90) — não assumir default no cliente.

## Modo de demonstração pública
Em produção, `POST /analyses` está desabilitado (403). A tela de "testar
valores" do dashboard deve usar `POST /compliance/preview` — que calcula
conformidade sem gravar nada — e exibir o resultado num componente
isolado, sem alterar ou re-buscar os dados reais do dashboard (`/analyses`,
`/kpis`, `/series`, `/alerts` continuam mostrando sempre o dado do seed).

## Segurança
- Nenhuma variável sensível hardcoded — `NEXT_PUBLIC_API_URL` via `.env.local`,
  nunca commitado. Manter `.env.example` atualizado.
- Toda chamada `fetch` com tratamento de erro explícito (status não-2xx,
  timeout, falha de rede) — nunca deixar promise rejeitada sem tratamento.
- Nunca expor chave/segredo do backend no bundle do cliente (tudo que começa
  com `NEXT_PUBLIC_` é público — só URL da API vai lá).

## Padrão de código
- TypeScript estrito, sem `any` sem justificativa.
- Componentes de UI não fazem fetch direto — usam funções de `lib/api-client.ts`.
- Loading e error state explícitos em toda tela que busca dado assíncrono.
- Nomes em inglês, comentários em português.

## Uso do Context7
Antes de gerar código usando API do Next.js, TanStack Query (se usado) ou
recharts, consultar o Context7 para confirmar a sintaxe da versão instalada
— não assumir da memória.

## Commits (Conventional Commits, em inglês)
`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`.
Exemplo: `feat(dashboard): add trend chart consuming /series endpoint`

**Título e corpo 100% em inglês, sem exceção** — já aconteceu desvio
(corpo em português em commits desta migração, corrigido via rebase antes
do merge). Não escrever nenhuma frase em português na mensagem de commit,
nem no título nem no corpo.

O commit que marca a fase como concluída na checklist da seção "Status
do plano de fases" (abaixo) entra **junto** no mesmo commit `feat` da
funcionalidade daquela fase — nunca como commit `docs` separado.
Exemplo: um único `feat(dashboard): add trend chart with reference
lines` já inclui tanto o código quanto o checkbox marcado no CLAUDE.md.

O repositório tem um hook local `.git/hooks/commit-msg` que remove
automaticamente as linhas `Co-Authored-By: Claude` e `Claude-Session:` de
toda mensagem de commit. Isso é intencional (configuração do usuário, não
do projeto) — não é necessário evitar gerar essas linhas na mensagem nem
tentar removê-las manualmente; o hook já cuida disso.

## Armadilhas de CSS conhecidas
`backdrop-filter`, `filter`, `transform`, `perspective` e `will-change`
apontando para qualquer um desses criam um *containing block* para
descendentes `position: fixed` — o `fixed` deixa de ser relativo à
viewport e passa a ser relativo à caixa desse ancestral. Isso já causou
um bug real: a `Topbar` usa `bg-background/85 backdrop-blur` no `<header>`
e continha a `SidebarNav` (aside fixo + drawer mobile, ambos `fixed`),
fazendo a sidebar "encolher" para o retângulo do header em vez de ocupar
a borda esquerda da tela inteira.

Solução aplicada (ver `components/dashboard/sidebar-nav.tsx`): renderizar
o elemento `fixed` via `createPortal` para `document.body`, escapando do
containing block do ancestral. Usar `useSyncExternalStore` (não
`useState` + `useEffect`) para detectar o mount no cliente sem disparar o
lint `react-hooks/set-state-in-effect` já configurado no projeto.

Se esse padrão aparecer de novo (qualquer `fixed` aninhado dentro de um
ancestral com `backdrop-filter`/`filter`/`transform`/`perspective`/
`will-change`), aplicar a mesma solução de portal.

## Fora de escopo
- Autenticação/login — não implementar se não foi pedido.
- Qualquer lógica de cálculo de conformidade — isso é do backend.
- Migração de biblioteca de gráfico — manter `recharts`, já usado na referência.

## Sobre `/design-reference/`
Pasta temporária com o código exportado do protótipo Lovable (repositório
`river-guard-ui`, que será descartado). Existe só para consulta durante a
migração — depois que a UI estiver recriada em `frontend/`, esta pasta deve
ser removida do monorepo.

## Status do plano de fases
- [x] Fase 0 — Tipos e cliente de API
- [x] Fase 1 — Layout base (topbar + sidebar-nav)
- [x] Fase 2 — KPI cards
- [x] Fase 3 — Parameter cards
- [x] Fase 4 — Trend chart
- [x] Fase 5 — Alerts feed
- [x] Fase 6 — Analyses table
- [x] Fase 7 — Tela de teste público (compliance preview)
- [ ] Fase 8 — Integração final e limpeza