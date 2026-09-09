import type { Pool } from "pg";
import { fromNaiveUtcLiteral, toNaiveUtcLiteral } from "../db/timestamp.js";
import type { ParamKey } from "../domain/parameters.js";

export interface NewAnalysis {
  paramKey: ParamKey;
  value: number;
  dateUtcIso: string;
  compliant: boolean;
  limitMin: number | null;
  limitMax: number;
}

export interface AnalysisRecord {
  id: number;
  paramKey: ParamKey;
  value: number;
  date: string;
  compliant: boolean;
}

interface AnalysisRow {
  id: number;
  param_key: ParamKey;
  value: string;
  date: string;
  compliant: boolean;
}

function mapRow(row: AnalysisRow): AnalysisRecord {
  return {
    id: row.id,
    paramKey: row.param_key,
    value: Number(row.value),
    date: fromNaiveUtcLiteral(row.date),
    compliant: row.compliant,
  };
}

/**
 * Única camada que insere análises no Postgres. Persiste também o
 * snapshot do limite usado na avaliação (`limit_min`/`limit_max`), para
 * não recalcular limites antigos caso a regra de negócio mude no futuro.
 */
export async function insertAnalysis(
  pool: Pool,
  analysis: NewAnalysis,
): Promise<AnalysisRecord> {
  const result = await pool.query<AnalysisRow>(
    `INSERT INTO analyses (param_key, value, date, compliant, limit_min, limit_max)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, param_key, value, date, compliant`,
    [
      analysis.paramKey,
      analysis.value,
      toNaiveUtcLiteral(analysis.dateUtcIso),
      analysis.compliant,
      analysis.limitMin,
      analysis.limitMax,
    ],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Inserção de análise não retornou nenhuma linha.");
  }

  return mapRow(row);
}

/**
 * Lista as análises dos últimos `days` dias, ordenadas por `date desc`
 * (mais recente primeiro).
 */
export async function findAnalysesByDays(
  pool: Pool,
  days: 7 | 30 | 90,
): Promise<AnalysisRecord[]> {
  const cutoffIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await pool.query<AnalysisRow>(
    `SELECT id, param_key, value, date, compliant
     FROM analyses
     WHERE date >= $1
     ORDER BY date DESC`,
    [toNaiveUtcLiteral(cutoffIso)],
  );

  return result.rows.map(mapRow);
}
