import { describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import type { Env } from "../config/env.js";
import { PARAMETERS } from "../domain/parameters.js";

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

describe("GET /parameters", () => {
  it("responde 200 com os 6 parâmetros monitorados e seus limites CONAMA 430/2011", async () => {
    const app = await buildApp(baseEnv());

    const response = await app.inject({ method: "GET", url: "/parameters" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(PARAMETERS);
  });

  it("documenta a rota no Swagger", async () => {
    const app = await buildApp(baseEnv());

    const response = await app.inject({
      method: "GET",
      url: "/documentation/json",
    });

    const spec = response.json<{ paths: Record<string, unknown> }>();
    expect(spec.paths).toHaveProperty("/parameters");
  });
});
