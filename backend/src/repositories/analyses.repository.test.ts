import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createPool } from "../db/pool.js";
import { insertAnalysis } from "./analyses.repository.js";

describe("insertAnalysis", () => {
  let pool: Pool;
  const insertedIds: number[] = [];

  beforeAll(() => {
    pool = createPool(process.env.DATABASE_URL!);
  });

  afterEach(async () => {
    if (insertedIds.length > 0) {
      await pool.query("DELETE FROM analyses WHERE id = ANY($1)", [
        insertedIds,
      ]);
      insertedIds.length = 0;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it("persiste a análise e retorna o registro com id numérico", async () => {
    const record = await insertAnalysis(pool, {
      paramKey: "dqo",
      value: 268,
      dateUtcIso: "2026-09-03T09:00:00Z",
      compliant: false,
      limitMin: null,
      limitMax: 250,
    });
    insertedIds.push(record.id);

    expect(typeof record.id).toBe("number");
    expect(record).toMatchObject({
      paramKey: "dqo",
      value: 268,
      date: "2026-09-03T09:00:00Z",
      compliant: false,
    });
  });

  it("grava e lê o instante como UTC, independentemente do timezone do processo", async () => {
    const record = await insertAnalysis(pool, {
      paramKey: "ph",
      value: 7,
      dateUtcIso: "2026-01-15T23:45:00.500Z",
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
    insertedIds.push(record.id);

    expect(record.date).toBe("2026-01-15T23:45:00.5Z");
  });

  it("permite limit_min nulo para parâmetros sem mínimo", async () => {
    const record = await insertAnalysis(pool, {
      paramKey: "temperatura",
      value: 41,
      dateUtcIso: "2026-05-01T00:00:00Z",
      compliant: false,
      limitMin: null,
      limitMax: 40,
    });
    insertedIds.push(record.id);

    const result = await pool.query<{ limit_min: string | null }>(
      "SELECT limit_min FROM analyses WHERE id = $1",
      [record.id],
    );
    expect(result.rows[0]?.limit_min).toBeNull();
  });
});
