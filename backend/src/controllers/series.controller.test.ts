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

describe("GET /series", () => {
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

  it("retorna a série do parâmetro pedido, mais antiga primeiro", async () => {
    const app = await buildApp(baseEnv(), pool);

    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dbo", value: 130, date: "2026-08-05T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dbo", value: 98, date: "2026-08-04T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7, date: "2026-08-04T09:00:00Z" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/series?param=dbo&days=90",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      param: string;
      days: number;
      points: { date: string; value: number; compliant: boolean }[];
    }>();
    expect(body.param).toBe("dbo");
    expect(body.days).toBe(90);
    expect(body.points).toEqual([
      { date: "2026-08-04T09:00:00Z", value: 98, compliant: true },
      { date: "2026-08-05T09:00:00Z", value: 130, compliant: false },
    ]);
  });

  it("responde com points vazio quando não há análises do parâmetro no período", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/series?param=og&days=7",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ param: "og", days: 7, points: [] });
  });

  it("responde 400 para param fora dos 6 parâmetros monitorados", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/series?param=invalido&days=7",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("responde 400 quando param está ausente", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/series?days=7",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("responde 400 quando days está ausente", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/series?param=ph",
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
      url: "/series?param=ph&days=15",
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
    expect(spec.paths).toHaveProperty("/series");
  });
});
