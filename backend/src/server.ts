import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createPool } from "./db/pool.js";

/**
 * Ponto de entrada do processo Node do backend: carrega o `.env`, valida
 * as variáveis de ambiente, monta a aplicação Fastify e sobe o listener
 * HTTP.
 */
export async function start(): Promise<void> {
  config({ quiet: true });
  const env = loadEnv(process.env);
  const pool = createPool(env.DATABASE_URL);
  const app = await buildApp(env, pool);

  try {
    await app.listen({ port: env.PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

const entryPath = process.argv[1];
const isDirectRun =
  entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href;

if (isDirectRun) {
  void start();
}
