import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

async function countAnalyses(pool: Pool): Promise<number> {
  const result = await pool.query<{ count: string }>(
    "SELECT COUNT(*) FROM analyses",
  );
  return Number(result.rows[0]?.count ?? 0);
}

describe("POST /compliance/preview", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createPool(process.env.DATABASE_URL!);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("é conforme exatamente no limite superior do pH (9)", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/compliance/preview",
      payload: { paramKey: "ph", value: 9 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
  });

  it("não é conforme exatamente em 40°C (limite exclusivo)", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/compliance/preview",
      payload: { paramKey: "temperatura", value: 40 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      compliant: false,
      limitMin: null,
      limitMax: 40,
    });
  });

  it("não insere nenhuma linha na tabela analyses", async () => {
    const app = await buildApp(baseEnv(), pool);
    const before = await countAnalyses(pool);

    const response = await app.inject({
      method: "POST",
      url: "/compliance/preview",
      payload: { paramKey: "dqo", value: 268 },
    });

    expect(response.statusCode).toBe(200);
    const after = await countAnalyses(pool);
    expect(after).toBe(before);
  });

  it("responde 400 para paramKey fora dos 6 parâmetros monitorados", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "POST",
      url: "/compliance/preview",
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
      url: "/compliance/preview",
      payload: { paramKey: "ph" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorBody>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("fica disponível mesmo com NODE_ENV=production", async () => {
    const app = await buildApp(baseEnv({ NODE_ENV: "production" }), pool);

    const response = await app.inject({
      method: "POST",
      url: "/compliance/preview",
      payload: { paramKey: "ph", value: 7 },
    });

    expect(response.statusCode).toBe(200);
  });

  it("documenta a rota no Swagger", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });

    const spec = response.json<{ paths: Record<string, unknown> }>();
    expect(spec.paths).toHaveProperty("/compliance/preview");
  });
});
