import { getParameter, type ParamKey } from "./parameters.js";

export interface ComplianceResult {
  compliant: boolean;
  limitMin: number | null;
  limitMax: number;
}

/**
 * Avalia a conformidade de um valor medido contra o limite CONAMA 430/2011
 * do parâmetro. O snapshot de limites retornado deve ser persistido junto
 * da análise (limit_min/limit_max), para não recalcular limites antigos
 * caso a regra de negócio mude no futuro.
 */
export function evaluateCompliance(
  paramKey: ParamKey,
  value: number,
): ComplianceResult {
  const { min, max, maxInclusive } = getParameter(paramKey);

  const compliant =
    min !== null
      ? value >= min && value <= max
      : maxInclusive
        ? value <= max
        : value < max;

  return { compliant, limitMin: min, limitMax: max };
}
