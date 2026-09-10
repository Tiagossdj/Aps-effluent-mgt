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
- Commits: Conventional Commits em inglês, uma mudança lógica por commit,
  não comite automaticamente por edição pequena.
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

## Fora de escopo
- Autenticação/login — não implementar se não foi pedido.
- Qualquer lógica de cálculo de conformidade — isso é do backend.
- Migração de biblioteca de gráfico — manter `recharts`, já usado na referência.

## Sobre `/design-reference/`
Pasta temporária com o código exportado do protótipo Lovable (repositório
`river-guard-ui`, que será descartado). Existe só para consulta durante a
migração — depois que a UI estiver recriada em `frontend/`, esta pasta deve
ser removida do monorepo.