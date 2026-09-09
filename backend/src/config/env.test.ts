import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

const validBase: NodeJS.ProcessEnv = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/effluent_mgt",
};

describe("loadEnv", () => {
  it("aplica os defaults quando as variáveis opcionais estão ausentes", () => {
    const env = loadEnv(validBase);

    expect(env).toEqual({
      DATABASE_URL: validBase.DATABASE_URL,
      PORT: 3001,
      FRONTEND_URL: "http://localhost:3000",
      RATE_LIMIT_MAX: 100,
      RATE_LIMIT_WINDOW: "1 minute",
      NODE_ENV: "development",
    });
  });

  it("usa os valores fornecidos quando presentes", () => {
    const env = loadEnv({
      ...validBase,
      PORT: "4000",
      FRONTEND_URL: "https://app.example.com",
      RATE_LIMIT_MAX: "50",
      RATE_LIMIT_WINDOW: "30 seconds",
      NODE_ENV: "production",
    });

    expect(env).toEqual({
      DATABASE_URL: validBase.DATABASE_URL,
      PORT: 4000,
      FRONTEND_URL: "https://app.example.com",
      RATE_LIMIT_MAX: 50,
      RATE_LIMIT_WINDOW: "30 seconds",
      NODE_ENV: "production",
    });
  });

  it("falha quando DATABASE_URL não está definida", () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });

  it("falha quando PORT não é um número válido", () => {
    expect(() => loadEnv({ ...validBase, PORT: "not-a-number" })).toThrow();
  });

  it("falha quando NODE_ENV tem um valor desconhecido", () => {
    expect(() =>
      loadEnv({ ...validBase, NODE_ENV: "staging" }),
    ).toThrow();
  });

  it("falha em produção sem FRONTEND_URL definida", () => {
    expect(() =>
      loadEnv({ ...validBase, NODE_ENV: "production" }),
    ).toThrow(/FRONTEND_URL/);
  });

  it("aceita produção com FRONTEND_URL definida", () => {
    const env = loadEnv({
      ...validBase,
      NODE_ENV: "production",
      FRONTEND_URL: "https://app.example.com",
    });

    expect(env.FRONTEND_URL).toBe("https://app.example.com");
  });
});
