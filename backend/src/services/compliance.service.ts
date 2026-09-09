import { evaluateCompliance } from "../domain/compliance.js";
import type { ParamKey } from "../domain/parameters.js";
import type { PreviewComplianceResponse } from "../schemas/compliance.schema.js";

/**
 * Avalia a conformidade de um valor hipotético para o modo de
 * demonstração pública — sem Repository, sem tocar o banco. Reaproveita
 * a mesma função pura usada por `POST /analyses`, para não duplicar a
 * regra de negócio.
 */
export function previewCompliance(
  paramKey: ParamKey,
  value: number,
): PreviewComplianceResponse {
  return evaluateCompliance(paramKey, value);
}
