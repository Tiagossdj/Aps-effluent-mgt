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

describe("POST /analyses", () => {
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

  it("cria uma análise conforme e responde 201", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7, date: "2026-09-03T09:00:00Z" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<{ id: string }>();
    expect(body.id).toMatch(/^AN-\d+$/);
    expect(body).toMatchObject({
      paramKey: "ph",
      value: 7,
      date: "2026-09-03T09:00:00Z",
      compliant: true,
    });
  });

  it("cria uma análise não conforme quando o valor excede o limite", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 268, date: "2026-09-03T09:00:00Z" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<{ id: string }>();
    expect(body.id).toMatch(/^AN-\d+$/);
    expect(body).toMatchObject({
      paramKey: "dqo",
      value: 268,
      date: "2026-09-03T09:00:00Z",
      compliant: false,
    });
  });

  it("marca não conforme quando a temperatura atinge exatamente o limite exclusivo de 40°C", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: {
        paramKey: "temperatura",
        value: 40,
        date: "2026-09-03T09:00:00Z",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json<{ compliant: boolean }>().compliant).toBe(false);
  });

  it("usa now() em UTC quando date não é informado", async () => {
    const app = await buildApp(baseEnv(), pool);
    const before = Date.now();

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7 },
    });

    const after = Date.now();
    expect(response.statusCode).toBe(201);

    const date = new Date(response.json<{ date: string }>().date).getTime();
    expect(date).toBeGreaterThanOrEqual(before);
    expect(date).toBeLessThanOrEqual(after);
  });

  it("responde 400 para paramKey fora dos 6 parâmetros monitorados", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "invalido", value: 1 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("responde 400 para value ausente", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("responde 400 para data futura", async () => {
    const app = await buildApp(baseEnv(), pool);
    const futureDate = new Date(Date.now() + 60_000).toISOString();

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7, date: futureDate },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("aceita data passada sem limite retroativo", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7, date: "2000-01-01T00:00:00Z" },
    });

    expect(response.statusCode).toBe(201);
  });

  it("responde 400 para data sem sufixo Z", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: {
        paramKey: "ph",
        value: 7,
        date: "2026-09-03T09:00:00+00:00",
      },
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
    expect(spec.paths).toHaveProperty("/analyses");
  });

  it("responde 403 com WRITE_DISABLED_IN_PRODUCTION quando NODE_ENV=production", async () => {
    const app = await buildApp(baseEnv({ NODE_ENV: "production" }), pool);
    const before = await pool.query<{ count: string }>(
      "SELECT COUNT(*) FROM analyses",
    );

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7 },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "WRITE_DISABLED_IN_PRODUCTION",
    );

    const after = await pool.query<{ count: string }>(
      "SELECT COUNT(*) FROM analyses",
    );
    expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
  });

  it("continua funcionando em desenvolvimento (NODE_ENV=development)", async () => {
    const app = await buildApp(baseEnv({ NODE_ENV: "development" }), pool);

    const response = await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7 },
    });

    expect(response.statusCode).toBe(201);
  });
});

describe("GET /analyses", () => {
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

  it("lista análises dos últimos N dias, mais recente primeiro", async () => {
    const app = await buildApp(baseEnv(), pool);

    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 7, date: "2026-09-01T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 268, date: "2026-09-03T09:00:00Z" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/analyses?days=90",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      data: { paramKey: string; date: string }[];
      meta: { days: number; count: number };
    }>();
    expect(body.meta).toEqual({ days: 90, count: 2 });
    expect(body.data.map((a) => a.paramKey)).toEqual(["dqo", "ph"]);
  });

  it("responde com data vazio e count 0 quando não há análises no período", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/analyses?days=7",
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
      url: "/analyses",
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
      url: "/analyses?days=15",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });
});
