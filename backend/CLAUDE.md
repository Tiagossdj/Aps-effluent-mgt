# Contexto — Backend (Fastify) — API de Conformidade de Efluentes

## Papel deste projeto
Web Service REST único responsável por toda a regra de negócio: registrar
análises laboratoriais e avaliar conformidade contra os limites da
Resolução CONAMA 430/2011. É o artefato "Web Service" exigido pela proposta
acadêmica (APS). Faz parte de um monorepo (`frontend/` + `backend/`).

## Estado do trabalho
Este projeto já teve um planejamento de fases feito com outra ferramenta
(Cursor). A Fase 1 (bootstrap) está confirmada e pronta para iniciar.
Continue a partir da Fase 1, seguindo a mesma disciplina de fases abaixo,
a menos que eu diga o contrário.

## Forma de trabalho (obrigatório)
- Trabalhe em uma fase por vez, nunca implemente o projeto inteiro de uma vez.
- Antes de iniciar cada fase: explique o objetivo, liste arquivos a
  criar/alterar, identifique decisões pendentes.
- Se uma informação necessária não estiver definida neste arquivo, PARE e
  pergunte — não invente valor, endpoint ou regra de negócio.
- Não deixe código temporário, mock ou TODO na implementação definitiva.
- Implemente testes junto com a funcionalidade, não depois.
- Commits: Conventional Commits em inglês, uma mudança lógica por commit,
  não comite automaticamente por edição pequena.

## Parâmetros monitorados (regra de negócio fixa — não alucinar valores)

| key | label | unit | min | max | maxInclusive |
|---|---|---|---|---|---|
| ph | pH | — | 5 | 9 | true |
| dbo | DBO 5 dias | mg/L | null | 120 | true |
| dqo | DQO | mg/L | null | 250 | true |
| temperatura | Temperatura | °C | null | 40 | **false** |
| ss | Sólidos suspensos | mg/L | null | 100 | true |
| og | Óleos e graxas | mg/L | null | 50 | true |

Regra de conformidade:
- Parâmetro com `min` definido (ph): conforme se `min <= valor <= max`.
- Parâmetro sem `min` e `maxInclusive: true`: conforme se `valor <= max`.
- Parâmetro sem `min` e `maxInclusive: false` (só temperatura): conforme se
  `valor < max`. **40°C exatos = não conforme.**

Se precisar de um valor de referência não listado aqui, PARE e pergunte —
não estimar.

## Arquitetura em camadas
```
Controller → Service → Repository → PostgreSQL
```
- **Controller** (`src/controllers/`): recebe requisição HTTP, valida input
  via schema Zod, chama o Service, formata resposta. Sem regra de negócio.
- **Service** (`src/services/`): lógica de avaliação de conformidade,
  orquestra chamadas ao Repository.
- **Repository** (`src/repositories/`): única camada que toca o banco.
- **Schemas** (`src/schemas/`): validação Zod de entrada/saída, convertidos
  para JSON Schema via `z.toJSONSchema()` (nativo do Zod v4) para Fastify
  e Swagger. (`zod-to-json-schema` foi descartado na Fase 5: seus tipos
  TypeScript ainda assumem Zod v3 e não compilam contra o Zod v4 instalado.)

## Banco de dados
- Coluna de data: `TIMESTAMP` (sem timezone) — não usar `TIMESTAMPTZ`.
- Toda leitura/escrita tratada como **UTC pela aplicação**: Zod valida
  entrada como ISO 8601 com sufixo `Z`; a aplicação garante que o instante
  persistido é UTC, independente do timezone do servidor.
- `id` é `SERIAL`. O id público exposto na API é `` `AN-${id}` ``
  (ex.: id `1` → `"AN-1"`), sem offset artificial.
- Tabela `analyses` deve guardar o snapshot do limite usado na avaliação
  (`limit_min`, `limit_max`) no momento da inserção — não recalcular
  limites antigos se a regra de negócio mudar no futuro.

## Endpoints e contrato JSON

### GET /parameters
```json
[
  { "key": "ph", "label": "pH", "unit": "", "min": 5, "max": 9, "maxInclusive": true },
  { "key": "temperatura", "label": "Temperatura", "unit": "°C", "min": null, "max": 40, "maxInclusive": false }
]
```

### POST /analyses
Request: `{ "paramKey": "dqo", "value": 268, "date": "2026-09-03T09:00:00Z" }`
`date` é opcional (default: `now()` em UTC). **Data futura → 400.** Data
passada sempre aceita, sem limite retroativo.

Response `201`:
```json
{ "id": "AN-1029", "paramKey": "dqo", "value": 268, "date": "2026-09-03T09:00:00Z", "compliant": false }
```

### GET /analyses?days=7|30|90
Ordenado por `date desc`.
```json
{
  "data": [{ "id": "AN-1000", "paramKey": "dqo", "value": 268, "date": "2026-09-03T09:00:00Z", "compliant": false }],
  "meta": { "days": 30, "count": 28 }
}
```

### GET /series?param=<key>&days=7|30|90
Ordenado por `date asc` (necessário para o gráfico de linha desenhar
corretamente da esquerda pra direita). `param` fora dos 6 keys → `400`
(erro de validação Zod, não 404).
```json
{
  "param": "dbo",
  "days": 30,
  "points": [{ "date": "2026-08-04T09:00:00Z", "value": 98, "compliant": true }]
}
```

### GET /kpis?days=7|30|90
`parametersInAlert` = contagem de `param_key` **distintos** com ao menos
uma não conformidade no período (não é total de análises não conformes).
`complianceRate`: uma casa decimal, arredondamento half-up (`82.05` → `82.1`).

Com dados:
```json
{ "totalAnalyses": 28, "complianceRate": 82.1, "parametersInAlert": 2, "lastCollectionAt": "2026-09-03T09:00:00Z" }
```

Sem dados no período (não é erro):
```json
{ "totalAnalyses": 0, "complianceRate": 0, "parametersInAlert": 0, "lastCollectionAt": null }
```

### GET /alerts?days=7|30|90
Análises não conformes do período, `date desc`.
```json
{
  "data": [{ "id": "AN-1000", "paramKey": "dqo", "value": 268, "date": "2026-09-03T09:00:00Z" }],
  "meta": { "days": 30, "count": 4 }
}
```

### Erros (padrão para todos os endpoints)
```json
{ "error": { "message": "Descrição legível do erro", "code": "VALIDATION_ERROR" } }
```
Códigos: `VALIDATION_ERROR` (400), `NOT_FOUND` (404, reservado para uso
futuro), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## Segurança (crítico)
- Variáveis de ambiente via `.env` (nunca hardcoded): `DATABASE_URL`,
  `PORT` (default `3001`), `FRONTEND_URL`, `RATE_LIMIT_MAX` (default `100`),
  `RATE_LIMIT_WINDOW` (default `1 minute`), `NODE_ENV`. Manter
  `.env.example` com chaves vazias, sempre atualizado.
- Validação de entrada: todo body/query/params validado com Zod antes do
  Service — nunca confiar em dado do cliente.
- Rate limiting: `@fastify/rate-limit` global, resposta `429` no formato
  de erro padrão acima.
- CORS: `@fastify/cors` restrito a `FRONTEND_URL`. **Obrigatório definir
  `FRONTEND_URL` se `NODE_ENV=production`** (falhar startup se ausente);
  em desenvolvimento, default `http://localhost:3000` se a env não estiver
  setada. Nunca `origin: '*'` em produção.
- SQL sempre parametrizado (`$1`, `$2`, ...) — nunca concatenação de string.
- Logs nunca expõem connection string completa ou qualquer segredo.
- Mensagens de erro para o cliente não vazam detalhe interno (stack trace,
  nome de tabela/coluna) — detalhe completo só no log do servidor.

## Documentação da API
`@fastify/swagger` + `@fastify/swagger-ui`, gerados a partir dos mesmos
schemas Zod da validação (single source of truth). Cada rota com
`summary`, schema de request e schema de response documentados.

## Seed de demonstração
`pnpm seed` — 90 dias de histórico, distribuição realista nos 6 parâmetros,
incluindo deliberadamente algumas não conformidades (ex.: DQO e Óleos&Graxas
ocasionalmente acima do limite) — necessário para o feed de alertas não
ficar vazio na demonstração da feira.

## CI
GitHub Actions: lint (ESLint, incluído desde a Fase 1) + testes
(`pnpm test -- --coverage`) em push/PR contra um Postgres de teste. Sem
deploy automatizado — só validação.

## Padrão de código
- TypeScript estrito, sem `any` sem justificativa.
- Uma responsabilidade por função/arquivo.
- Toda falha assíncrona tratada (try/catch ou `fastify.setErrorHandler`).
- Nomes em inglês, comentários e docstrings em português.

## Uso do Context7
Antes de gerar código usando API do Fastify, Zod, ou qualquer plugin
(`@fastify/rate-limit`, `@fastify/swagger`, `@fastify/cors`, etc.),
consultar o Context7 para confirmar a sintaxe da versão instalada — não
assumir da memória.

## Fora de escopo
- Autenticação/login — não implementar se não foi pedido.
- Modelo preditivo/IA — conformidade é comparação determinística contra a
  tabela de limites acima, decisão já tomada.
- Arquitetura de microsserviços — camadas simples é intencional.

## Referência de fases já planejadas (Cursor)
1. Bootstrap (tsconfig estrito, scripts, `.env.example`, Vitest, ESLint)
2. Domínio (constantes + regras de conformidade, testes de fronteira)
3. Postgres + migrations + pool injetável (`node-pg-migrate`)
4. Fastify (env, CORS, rate limit, Swagger, error handler)
5. GET /parameters
6. Repository + POST /analyses
7. GET /analyses
8. GET /series
9. GET /kpis
10. GET /alerts
11. Seed de demonstração
12. Cobertura de testes + CI