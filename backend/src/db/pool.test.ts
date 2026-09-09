import { afterEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createPool } from "./pool.js";

describe("createPool", () => {
  let pool: Pool | undefined;

  afterEach(async () => {
    await pool?.end();
    pool = undefined;
  });

  it("conecta ao Postgres e executa uma query simples", async () => {
    pool = createPool(process.env.DATABASE_URL!);

    const result = await pool.query<{ value: number }>("SELECT 1 AS value");

    expect(result.rows[0]?.value).toBe(1);
  });

  it("cada chamada cria um pool independente, sem estado compartilhado", async () => {
    const poolA = createPool(process.env.DATABASE_URL!);
    const poolB = createPool(process.env.DATABASE_URL!);

    expect(poolA).not.toBe(poolB);

    await Promise.all([
      poolA.query("SELECT 1"),
      poolB.query("SELECT 1"),
    ]);

    await poolA.end();
    await poolB.end();
  });
});
