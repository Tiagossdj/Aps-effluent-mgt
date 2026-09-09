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

export interface SeriesPointRecord {
  date: string;
  value: number;
  compliant: boolean;
}

interface SeriesPointRow {
  value: string;
  date: string;
  compliant: boolean;
}

function mapSeriesPointRow(row: SeriesPointRow): SeriesPointRecord {
  return {
    date: fromNaiveUtcLiteral(row.date),
    value: Number(row.value),
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

export interface KpisRecord {
  totalAnalyses: number;
  compliantCount: number;
  parametersInAlert: number;
  lastCollectionAt: string | null;
}

interface KpisRow {
  total: string;
  compliant_count: string;
  alert_params: string;
  last_collection: string | null;
}

function mapKpisRow(row: KpisRow): KpisRecord {
  return {
    totalAnalyses: Number(row.total),
    compliantCount: Number(row.compliant_count),
    parametersInAlert: Number(row.alert_params),
    lastCollectionAt: row.last_collection
      ? fromNaiveUtcLiteral(row.last_collection)
      : null,
  };
}

/**
 * Agrega os KPIs dos últimos `days` dias em uma única query. `alert_params`
 * conta `param_key` **distintos** com ao menos uma não conformidade no
 * período (não é o total de análises não conformes). Sobre um conjunto
 * vazio, `COUNT` retorna `0` e `MAX` retorna `NULL` naturalmente — o caso
 * "sem dados no período" não precisa de tratamento especial.
 */
export async function findKpisByDays(
  pool: Pool,
  days: 7 | 30 | 90,
): Promise<KpisRecord> {
  const cutoffIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await pool.query<KpisRow>(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE compliant) AS compliant_count,
       COUNT(DISTINCT param_key) FILTER (WHERE NOT compliant) AS alert_params,
       MAX(date) AS last_collection
     FROM analyses
     WHERE date >= $1`,
    [toNaiveUtcLiteral(cutoffIso)],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Consulta de KPIs não retornou nenhuma linha.");
  }

  return mapKpisRow(row);
}

/**
 * Série temporal de um parâmetro nos últimos `days` dias, ordenada por
 * `date asc` — necessário para o gráfico de linha desenhar da esquerda
 * pra direita.
 */
export async function findSeriesByParamAndDays(
  pool: Pool,
  paramKey: ParamKey,
  days: 7 | 30 | 90,
): Promise<SeriesPointRecord[]> {
  const cutoffIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await pool.query<SeriesPointRow>(
    `SELECT value, date, compliant
     FROM analyses
     WHERE param_key = $1 AND date >= $2
     ORDER BY date ASC`,
    [paramKey, toNaiveUtcLiteral(cutoffIso)],
  );

  return result.rows.map(mapSeriesPointRow);
}
