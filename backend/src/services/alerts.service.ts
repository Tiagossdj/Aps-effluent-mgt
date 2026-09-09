import type { Pool } from "pg";
import { findAlertsByDays } from "../repositories/analyses.repository.js";
import type { AlertDto, ListAlertsResponse } from "../schemas/alerts.schema.js";

/**
 * Lista as análises não conformes dos últimos `days` dias, mais recente
 * primeiro.
 */
export async function listAlerts(
  pool: Pool,
  days: 7 | 30 | 90,
): Promise<ListAlertsResponse> {
  const records = await findAlertsByDays(pool, days);

  const data: AlertDto[] = records.map((record) => ({
    id: `AN-${record.id}`,
    paramKey: record.paramKey,
    value: record.value,
    date: record.date,
  }));

  return {
    data,
    meta: { days, count: data.length },
  };
}
