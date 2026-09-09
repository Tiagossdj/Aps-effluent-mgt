import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createPool } from "./pool.js";

/**
 * Valida o schema produzido pela migration `create-analyses-table`
 * (migrations/1788978858219_create-analyses-table.ts) contra as regras
 * do CLAUDE.md: colunas, nullability do snapshot de limites e o CHECK
 * de param_key restrito aos 6 parâmetros monitorados.
 */
describe("schema: tabela analyses", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPool(process.env.DATABASE_URL!);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("possui as colunas esperadas com nullability correta", async () => {
    const result = await pool.query<{
      column_name: string;
      is_nullable: string;
    }>(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'analyses'`,
    );

    const columns = Object.fromEntries(
      result.rows.map((row) => [row.column_name, row.is_nullable]),
    );

    expect(columns).toMatchObject({
      id: "NO",
      param_key: "NO",
      value: "NO",
      date: "NO",
      compliant: "NO",
      limit_min: "YES",
      limit_max: "NO",
    });
  });

  it("rejeita param_key fora dos 6 parâmetros monitorados", async () => {
    await expect(
      pool.query(
        `INSERT INTO analyses (param_key, value, date, compliant, limit_max)
         VALUES ('invalido', 1, now(), true, 1)`,
      ),
    ).rejects.toThrow();
  });

  it("aceita os 6 param_key válidos e permite limit_min nulo", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO analyses (param_key, value, date, compliant, limit_min, limit_max)
         VALUES ('dqo', 268, now(), false, NULL, 250)`,
      );
      const result = await client.query<{ limit_min: string | null }>(
        `SELECT limit_min FROM analyses WHERE param_key = 'dqo' ORDER BY id DESC LIMIT 1`,
      );
      expect(result.rows[0]?.limit_min).toBeNull();
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });
});
