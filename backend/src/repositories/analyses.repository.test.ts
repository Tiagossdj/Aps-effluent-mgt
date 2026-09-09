import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { createPool } from "../db/pool.js";
import {
  findAnalysesByDays,
  findSeriesByParamAndDays,
  insertAnalysis,
} from "./analyses.repository.js";

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

describe("findAnalysesByDays", () => {
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

  it("retorna apenas análises dentro da janela de dias, mais recente primeiro", async () => {
    const now = Date.now();
    const withinWindow = await insertAnalysis(pool, {
      paramKey: "ph",
      value: 7,
      dateUtcIso: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
    const olderInsideWindow = await insertAnalysis(pool, {
      paramKey: "ph",
      value: 6,
      dateUtcIso: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
    const outsideWindow = await insertAnalysis(pool, {
      paramKey: "ph",
      value: 8,
      dateUtcIso: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
    insertedIds.push(withinWindow.id, olderInsideWindow.id, outsideWindow.id);

    const records = await findAnalysesByDays(pool, 7);

    expect(records.map((r) => r.id)).toEqual([
      withinWindow.id,
      olderInsideWindow.id,
    ]);
  });

  it("retorna array vazio quando não há análises no período", async () => {
    const records = await findAnalysesByDays(pool, 7);
    expect(records).toEqual([]);
  });
});

describe("findSeriesByParamAndDays", () => {
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

  it("retorna apenas pontos do parâmetro pedido, dentro da janela e ordenados por data asc", async () => {
    const now = Date.now();
    const older = await insertAnalysis(pool, {
      paramKey: "dqo",
      value: 100,
      dateUtcIso: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: null,
      limitMax: 250,
    });
    const newer = await insertAnalysis(pool, {
      paramKey: "dqo",
      value: 268,
      dateUtcIso: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: false,
      limitMin: null,
      limitMax: 250,
    });
    const outsideWindow = await insertAnalysis(pool, {
      paramKey: "dqo",
      value: 90,
      dateUtcIso: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: null,
      limitMax: 250,
    });
    const otherParam = await insertAnalysis(pool, {
      paramKey: "ph",
      value: 7,
      dateUtcIso: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
    insertedIds.push(older.id, newer.id, outsideWindow.id, otherParam.id);

    const points = await findSeriesByParamAndDays(pool, "dqo", 7);

    expect(points).toEqual([
      { date: older.date, value: 100, compliant: true },
      { date: newer.date, value: 268, compliant: false },
    ]);
  });

  it("retorna array vazio quando não há análises do parâmetro no período", async () => {
    const points = await findSeriesByParamAndDays(pool, "ph", 7);
    expect(points).toEqual([]);
  });
});
