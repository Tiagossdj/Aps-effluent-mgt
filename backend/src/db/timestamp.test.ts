import { describe, expect, it } from "vitest";
import { fromNaiveUtcLiteral, toNaiveUtcLiteral } from "./timestamp.js";

describe("toNaiveUtcLiteral", () => {
  it("remove o sufixo Z de um ISO 8601 UTC", () => {
    expect(toNaiveUtcLiteral("2026-09-03T09:00:00Z")).toBe(
      "2026-09-03T09:00:00",
    );
  });

  it("preserva frações de segundo", () => {
    expect(toNaiveUtcLiteral("2026-09-03T09:00:00.789Z")).toBe(
      "2026-09-03T09:00:00.789",
    );
  });
});

describe("fromNaiveUtcLiteral", () => {
  it("converte o formato de saída do Postgres para ISO 8601 UTC", () => {
    expect(fromNaiveUtcLiteral("2026-09-03 09:00:00")).toBe(
      "2026-09-03T09:00:00Z",
    );
  });

  it("preserva frações de segundo", () => {
    expect(fromNaiveUtcLiteral("2026-09-03 09:00:00.789")).toBe(
      "2026-09-03T09:00:00.789Z",
    );
  });

  it("é a inversa de toNaiveUtcLiteral (ida e volta)", () => {
    const original = "2026-01-15T23:45:00.5Z";
    const naive = toNaiveUtcLiteral(original);
    expect(fromNaiveUtcLiteral(naive.replace("T", " "))).toBe(original);
  });
});
