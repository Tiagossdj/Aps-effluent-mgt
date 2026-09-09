import { runner } from "node-pg-migrate";
import { config } from "dotenv";

config({ path: ".env.test" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não definida — verifique o arquivo .env.test antes de rodar os testes.",
  );
}

/**
 * Aplica as migrations pendentes no Postgres de teste antes da suíte
 * rodar. `advisoryLockMode: "wait"` evita falha por lock quando o Vitest
 * sobe múltiplos workers em paralelo — cada worker espera o lock em vez
 * de abortar; migrations já aplicadas são no-op.
 */
await runner({
  databaseUrl,
  dir: "migrations",
  direction: "up",
  migrationsTable: "pgmigrations",
  advisoryLockMode: "wait",
  log: () => {},
});
