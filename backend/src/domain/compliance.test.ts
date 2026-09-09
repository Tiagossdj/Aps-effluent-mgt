import { describe, expect, it } from "vitest";
import { evaluateCompliance } from "./compliance.js";

describe("evaluateCompliance — ph (min e max inclusivos)", () => {
  it("é conforme exatamente no limite inferior (5)", () => {
    expect(evaluateCompliance("ph", 5)).toEqual({
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
  });

  it("é conforme exatamente no limite superior (9)", () => {
    expect(evaluateCompliance("ph", 9).compliant).toBe(true);
  });

  it("não é conforme logo abaixo do limite inferior (4.99)", () => {
    expect(evaluateCompliance("ph", 4.99).compliant).toBe(false);
  });

  it("não é conforme logo acima do limite superior (9.01)", () => {
    expect(evaluateCompliance("ph", 9.01).compliant).toBe(false);
  });

  it("é conforme no meio da faixa (7)", () => {
    expect(evaluateCompliance("ph", 7).compliant).toBe(true);
  });
});

describe("evaluateCompliance — dbo (sem min, max inclusivo)", () => {
  it("é conforme exatamente no limite (120)", () => {
    expect(evaluateCompliance("dbo", 120)).toEqual({
      compliant: true,
      limitMin: null,
      limitMax: 120,
    });
  });

  it("não é conforme um decimal acima do limite (120.01)", () => {
    expect(evaluateCompliance("dbo", 120.01).compliant).toBe(false);
  });
});

describe("evaluateCompliance — dqo (sem min, max inclusivo)", () => {
  it("é conforme exatamente no limite (250)", () => {
    expect(evaluateCompliance("dqo", 250).compliant).toBe(true);
  });

  it("não é conforme um decimal acima do limite (250.01)", () => {
    expect(evaluateCompliance("dqo", 250.01).compliant).toBe(false);
  });

  it("não é conforme bem acima do limite (268)", () => {
    expect(evaluateCompliance("dqo", 268).compliant).toBe(false);
  });
});

describe("evaluateCompliance — temperatura (sem min, max EXCLUSIVO)", () => {
  it("NÃO é conforme exatamente em 40°C", () => {
    expect(evaluateCompliance("temperatura", 40)).toEqual({
      compliant: false,
      limitMin: null,
      limitMax: 40,
    });
  });

  it("é conforme um centésimo abaixo do limite (39.99)", () => {
    expect(evaluateCompliance("temperatura", 39.99).compliant).toBe(true);
  });

  it("não é conforme acima do limite (40.01)", () => {
    expect(evaluateCompliance("temperatura", 40.01).compliant).toBe(false);
  });
});

describe("evaluateCompliance — ss (sem min, max inclusivo)", () => {
  it("é conforme exatamente no limite (100)", () => {
    expect(evaluateCompliance("ss", 100).compliant).toBe(true);
  });

  it("não é conforme um decimal acima do limite (100.01)", () => {
    expect(evaluateCompliance("ss", 100.01).compliant).toBe(false);
  });
});

describe("evaluateCompliance — og (sem min, max inclusivo)", () => {
  it("é conforme exatamente no limite (50)", () => {
    expect(evaluateCompliance("og", 50).compliant).toBe(true);
  });

  it("não é conforme um decimal acima do limite (50.01)", () => {
    expect(evaluateCompliance("og", 50.01).compliant).toBe(false);
  });
});
