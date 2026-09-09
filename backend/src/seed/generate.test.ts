import { describe, expect, it } from "vitest";
import { evaluateCompliance } from "../domain/compliance.js";
import { PARAM_KEYS } from "../domain/parameters.js";
import { generateSeedAnalyses, SEED_DAYS } from "./generate.js";

const NOW = new Date("2026-09-09T09:00:00.000Z");

function analysesWithinDays(
  analyses: ReturnType<typeof generateSeedAnalyses>,
  days: number,
) {
  const cutoff = new Date(
    NOW.getTime() - days * 24 * 60 * 60 * 1000,
  ).toISOString();
  return analyses.filter((a) => a.dateUtcIso >= cutoff);
}

describe("generateSeedAnalyses", () => {
  it("gera uma análise por parâmetro por dia, para SEED_DAYS dias", () => {
    const analyses = generateSeedAnalyses(NOW);
    expect(analyses).toHaveLength(SEED_DAYS * PARAM_KEYS.length);
  });

  it("nunca gera data futura — a coleta mais recente é exatamente `now`", () => {
    const analyses = generateSeedAnalyses(NOW);
    for (const analysis of analyses) {
      expect(analysis.dateUtcIso <= NOW.toISOString()).toBe(true);
    }
    expect(analyses.some((a) => a.dateUtcIso === NOW.toISOString())).toBe(
      true,
    );
  });

  it("o campo compliant e o snapshot de limites batem com evaluateCompliance", () => {
    const analyses = generateSeedAnalyses(NOW);
    for (const analysis of analyses) {
      const expected = evaluateCompliance(analysis.paramKey, analysis.value);
      expect(analysis.compliant).toBe(expected.compliant);
      expect(analysis.limitMin).toBe(expected.limitMin);
      expect(analysis.limitMax).toBe(expected.limitMax);
    }
  });

  it.each(["ph", "dbo", "ss", "temperatura"] as const)(
    "%s é sempre conforme no seed (não é um parâmetro com não conformidade deliberada)",
    (paramKey) => {
      const analyses = generateSeedAnalyses(NOW);
      const values = analyses.filter((a) => a.paramKey === paramKey);
      expect(values.length).toBeGreaterThan(0);
      expect(values.every((a) => a.compliant)).toBe(true);
    },
  );

  it.each([7, 30, 90] as const)(
    "dqo e og têm ao menos uma não conformidade nos últimos %s dias, garantindo alertas na demo",
    (days) => {
      const analyses = analysesWithinDays(generateSeedAnalyses(NOW), days);
      for (const paramKey of ["dqo", "og"] as const) {
        const nonCompliant = analyses.filter(
          (a) => a.paramKey === paramKey && !a.compliant,
        );
        expect(nonCompliant.length).toBeGreaterThan(0);
      }
    },
  );

  it("é determinístico: mesma now/seed produz sempre o mesmo resultado", () => {
    expect(generateSeedAnalyses(NOW)).toEqual(generateSeedAnalyses(NOW));
  });

  it("seeds diferentes produzem distribuições diferentes", () => {
    const a = generateSeedAnalyses(NOW, 1);
    const b = generateSeedAnalyses(NOW, 2);
    expect(a).not.toEqual(b);
  });
});
