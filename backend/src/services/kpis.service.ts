import type { Pool } from "pg";
import { compliancePercentage } from "../domain/rounding.js";
import { findKpisByDays } from "../repositories/analyses.repository.js";
import type { KpisResponse } from "../schemas/kpis.schema.js";

/**
 * Monta os KPIs do período: total de análises, taxa de conformidade
 * (half-up, 1 casa decimal), quantidade de parâmetros distintos com
 * não conformidade no período e data da última coleta.
 */
export async function getKpis(
  pool: Pool,
  days: 7 | 30 | 90,
): Promise<KpisResponse> {
  const { totalAnalyses, compliantCount, parametersInAlert, lastCollectionAt } =
    await findKpisByDays(pool, days);

  return {
    totalAnalyses,
    complianceRate: compliancePercentage(compliantCount, totalAnalyses),
    parametersInAlert,
    lastCollectionAt,
  };
}
