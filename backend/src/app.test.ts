import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { Env } from "./config/env.js";

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

describe("buildApp", () => {
  describe("CORS", () => {
    it("reflete a origem configurada em FRONTEND_URL", async () => {
      const app = await buildApp(baseEnv());

      const response = await app.inject({
        method: "GET",
        url: "/documentation/json",
        headers: { origin: "http://localhost:3000" },
      });

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
    });

    it("nunca reflete a origem da requisição — sempre responde com a FRONTEND_URL fixa", async () => {
      const app = await buildApp(baseEnv());

      const response = await app.inject({
        method: "GET",
        url: "/documentation/json",
        headers: { origin: "http://attacker.example.com" },
      });

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
    });
  });

  describe("Swagger", () => {
    it("expõe a especificação OpenAPI em /documentation/json", async () => {
      const app = await buildApp(baseEnv());

      const response = await app.inject({
        method: "GET",
        url: "/documentation/json",
      });

      expect(response.statusCode).toBe(200);
      expect(
        response.json<{ info: { title: string } }>().info.title,
      ).toBe("API de Conformidade de Efluentes");
    });
  });

  describe("Not found handler", () => {
    it("responde 404 no formato de erro padrão para rotas inexistentes", async () => {
      const app = await buildApp(baseEnv());

      const response = await app.inject({
        method: "GET",
        url: "/rota-inexistente",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json<ApiErrorBody>()).toEqual({
        error: { message: "Rota não encontrada.", code: "NOT_FOUND" },
      });
    });
  });

  describe("Error handler", () => {
    it("responde 400 no formato padrão para erro de validação de schema", async () => {
      const app = await buildApp(baseEnv());
      app.get(
        "/test/validation",
        {
          schema: {
            querystring: {
              type: "object",
              required: ["value"],
              properties: { value: { type: "number" } },
            },
          },
        },
        () => ({ ok: true }),
      );

      const response = await app.inject({
        method: "GET",
        url: "/test/validation",
      });

      expect(response.statusCode).toBe(400);
      expect(response.json<ApiErrorBody>().error.code).toBe(
        "VALIDATION_ERROR",
      );
    });

    it("responde 500 no formato padrão sem vazar detalhes internos do erro", async () => {
      const app = await buildApp(baseEnv());
      app.get("/test/boom", () => {
        throw new Error("detalhe interno sensível: coluna secreta");
      });

      const response = await app.inject({
        method: "GET",
        url: "/test/boom",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json<ApiErrorBody>()).toEqual({
        error: {
          message: "Erro interno do servidor.",
          code: "INTERNAL_ERROR",
        },
      });
    });
  });

  describe("Rate limit", () => {
    it("responde 429 no formato padrão ao exceder RATE_LIMIT_MAX", async () => {
      const app = await buildApp(baseEnv({ RATE_LIMIT_MAX: 1 }));
      app.get("/test/ping", () => ({ ok: true }));

      const first = await app.inject({ method: "GET", url: "/test/ping" });
      expect(first.statusCode).toBe(200);

      const second = await app.inject({ method: "GET", url: "/test/ping" });
      expect(second.statusCode).toBe(429);
      expect(second.json<ApiErrorBody>().error.code).toBe("RATE_LIMITED");
    });
  });
});
