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

interface KpisBody {
  totalAnalyses: number;
  complianceRate: number;
  parametersInAlert: number;
  lastCollectionAt: string | null;
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

describe("GET /kpis", () => {
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

  it("calcula totalAnalyses, complianceRate e parametersInAlert (contagem de param_key distintos) no período", async () => {
    const app = await buildApp(baseEnv(), pool);

    // 2 análises de dqo (1 conforme, 1 não) + 1 análise de ph não conforme
    // fora dos 6 parâmetros -> parametersInAlert deve ser 2 (dqo, ph),
    // não 2 análises não conformes coincidentemente iguais ao total de
    // não conformidades: o teste abaixo adiciona uma segunda não
    // conformidade em dqo para provar que não é COUNT(*).
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 268, date: "2026-08-05T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 240, date: "2026-08-06T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "dqo", value: 100, date: "2026-08-04T09:00:00Z" },
    });
    await app.inject({
      method: "POST",
      url: "/analyses",
      payload: { paramKey: "ph", value: 12, date: "2026-08-04T09:00:00Z" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/kpis?days=90",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<KpisBody>();
    expect(body.totalAnalyses).toBe(4);
    // 2 conformes de 4 -> 50.0%
    expect(body.complianceRate).toBe(50);
    // dqo e ph têm não conformidade -> 2 parâmetros distintos, não 3
    // análises não conformes
    expect(body.parametersInAlert).toBe(2);
    expect(body.lastCollectionAt).toBe("2026-08-06T09:00:00Z");
  });

  it("responde com o formato de período sem dados em vez de erro", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/kpis?days=7",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      totalAnalyses: 0,
      complianceRate: 0,
      parametersInAlert: 0,
      lastCollectionAt: null,
    });
  });

  it("responde 400 quando days está ausente", async () => {
    const app = await buildApp(baseEnv(), pool);

    const response = await app.inject({
      method: "GET",
      url: "/kpis",
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
      url: "/kpis?days=15",
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
    expect(spec.paths).toHaveProperty("/kpis");
  });
});
