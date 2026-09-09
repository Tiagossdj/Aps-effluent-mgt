import type { Pool } from "pg";
import type { ParamKey } from "../domain/parameters.js";
import { findSeriesByParamAndDays } from "../repositories/analyses.repository.js";
import type { SeriesPointDto, SeriesResponse } from "../schemas/series.schema.js";

/**
 * Monta a série temporal de um parâmetro nos últimos `days` dias, mais
 * antiga primeiro (`date asc`).
 */
export async function getSeries(
  pool: Pool,
  paramKey: ParamKey,
  days: 7 | 30 | 90,
): Promise<SeriesResponse> {
  const records = await findSeriesByParamAndDays(pool, paramKey, days);

  const points: SeriesPointDto[] = records.map((record) => ({
    date: record.date,
    value: record.value,
    compliant: record.compliant,
  }));

  return { param: paramKey, days, points };
}
