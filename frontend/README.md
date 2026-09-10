# Frontend — Dashboard de Conformidade de Efluentes

Dashboard Next.js que exibe a conformidade de análises de efluentes
industriais frente aos limites de lançamento da Resolução CONAMA
nº 430/2011. É um cliente puro da API REST do backend Fastify — não
contém regra de negócio nem calcula conformidade (ver `CLAUDE.md`).

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- [recharts](https://recharts.org) para o gráfico de tendência
- TypeScript estrito

## Monorepo

Este pacote faz parte do monorepo `Aps-effluent-mgt` (pnpm workspaces),
junto com `../backend` (API Fastify). Para rodar o dashboard é preciso
de uma API respondendo em `NEXT_PUBLIC_API_URL` — use a URL de produção
já configurada em `.env.example`, ou rode o backend localmente (ver
`../backend/CLAUDE.md`).

## Rodando localmente

```bash
pnpm install
cp .env.example .env.local   # ajuste NEXT_PUBLIC_API_URL se necessário
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | sim | URL base da API Fastify, sem barra final |

## Scripts

- `pnpm dev` — servidor de desenvolvimento
- `pnpm build` — build de produção
- `pnpm start` — serve o build de produção
- `pnpm lint` — ESLint
