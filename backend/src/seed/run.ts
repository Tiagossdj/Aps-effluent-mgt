import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import { loadEnv } from "../config/env.js";
import { createPool } from "../db/pool.js";
import {
  clearAnalyses,
  insertAnalysis,
} from "../repositories/analyses.repository.js";
import { generateSeedAnalyses } from "./generate.js";

/**
 * Popula o Postgres com 90 dias de histórico de demonstração: limpa a
 * tabela `analyses` e insere os dados gerados por `generateSeedAnalyses`
 * (ver CLAUDE.md — seed de demonstração).
 */
export async function main(): Promise<void> {
  config({ quiet: true });
  const env = loadEnv(process.env);

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Seed de demonstração recusado: NODE_ENV=production. O seed apaga todas as análises antes de inserir — rode apenas em desenvolvimento ou teste.",
    );
  }

  const pool = createPool(env.DATABASE_URL);

  try {
    const analyses = generateSeedAnalyses();

    await clearAnalyses(pool);
    for (const analysis of analyses) {
      await insertAnalysis(pool, analysis);
    }

    console.log(`Seed concluído: ${analyses.length} análises inseridas.`);
  } finally {
    await pool.end();
  }
}

const entryPath = process.argv[1];
const isDirectRun =
  entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href;

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error("Falha ao executar o seed:", error);
    process.exit(1);
  });
}
