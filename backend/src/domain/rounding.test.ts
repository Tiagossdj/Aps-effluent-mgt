import { describe, expect, it } from "vitest";
import { compliancePercentage } from "./rounding.js";

describe("compliancePercentage", () => {
  it("retorna 0 quando o total é 0 (período sem dados)", () => {
    expect(compliancePercentage(0, 0)).toBe(0);
  });

  it("arredonda para baixo quando a segunda casa decimal é menor que 5", () => {
    // 23/28 = 82.142857...%
    expect(compliancePercentage(23, 28)).toBe(82.1);
  });

  it("arredonda meio-para-cima (half-up) em fronteira exata ,x5", () => {
    // 1641/2000 = 0.8205 exatamente -> 82.05% -> half-up -> 82.1
    // Em ponto flutuante ingênuo, 82.05 * 10 é representado como
    // 820.4999999999999, e Math.round arredondaria para 820 (82.0),
    // não 821 (82.1) — exatamente o bug que este teste evita.
    expect(compliancePercentage(1641, 2000)).toBe(82.1);
  });

  it("resulta em 100 quando todas as análises são conformes", () => {
    expect(compliancePercentage(5, 5)).toBe(100);
  });

  it("resulta em 0 quando nenhuma análise é conforme", () => {
    expect(compliancePercentage(0, 5)).toBe(0);
  });
});
