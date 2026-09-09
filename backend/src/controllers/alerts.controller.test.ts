import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { buildApp } from "../app.js";
import type { Env } from "../config/env.js";
import { createPool } from "../db/pool.js";

interface ApiErrorBody {
  error: {
    message: string;
    code: string;
  };
}

interface AlertDto {
  id: string;
  paramKey: string;
  value: number;
  date: string;
}

interface AlertsBody {
  data: AlertDto[];
  meta: { days: number; count: number };
}

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    DATABASE_URL: "postgres://user:pass@localhost:5432/effluent_mgt",
    PORT: 3001,
    FRONTEND_URL: "http://localhost:3000",
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: "1 minute",
    NODE_ENV: "test",
    ...overrides,
  };
}

describe("GET /alerts", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPool(process.env.DATABASE_URL!);
  });

  afterEach(async () => {
    await pool.query("DELETE FROM analyses");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("lista apenas análises não conformes do período, mais recente primeiro, sem campo compliant", async () => {
    const app = await buildApp(baseEnv(), pool);

    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 268, date: "2026-08-05T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 12, date: "2026-08-06T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 100, date: "2026-08-07T09:00:00Z" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/alerts?days=90",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<AlertsBody>();
    expect(body.meta).toEqual({ days: 90, count: 2 });
    expect(
      body.data.map(({ paramKey, value, date }) => ({
        paramKey,
        value,
        date,
      })),
    ).toEqual([
      { paramKey: "ph", value: 12, date: "2026-08-06T09:00:00Z" },
      { paramKey: "dqo", value: 268, date: "2026-08-05T09:00:00Z" },
    ]);
    expect(body.data[0]?.id).toMatch(/^AN-\d+$/);
    expect(body.data[0]).not.toHaveProperty("compliant");
  });

  it("responde com data vazio e count 0 quando não há não conformidades no período", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/alerts?days=7",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      meta: { days: 7, count: 0 },
    });
  });

  it("responde 400 quando days está ausente", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/alerts",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("responde 400 quando days não é 7, 30 ou 90", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/alerts?days=15",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("documenta a rota no Swagger", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });

    const spec = response.json<{ paths: Record<string, unknown> }>();
    expect(spec.paths).toHaveProperty("/alerts");
  });
});
