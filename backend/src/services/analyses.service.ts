import type { Pool } from "pg";
import { evaluateCompliance } from "../domain/compliance.js";
import type { ParamKey } from "../domain/parameters.js";
import { insertAnalysis } from "../repositories/analyses.repository.js";
import type { AnalysisDto } from "../schemas/analyses.schema.js";

export interface CreateAnalysisInput {
  paramKey: ParamKey;
  value: number;
  dateUtcIso: string;
}

/**
 * Avalia a conformidade do valor informado contra os limites CONAMA
 * 430/2011 e persiste a análise com o snapshot do limite usado.
 */
export async function createAnalysis(
  pool: Pool,
  input: CreateAnalysisInput,
): Promise<AnalysisDto> {
  const { compliant, limitMin, limitMax } = evaluateCompliance(
    input.paramKey,
    input.value,
  );

  const record = await insertAnalysis(pool, {
    paramKey: input.paramKey,
    value: input.value,
    dateUtcIso: input.dateUtcIso,
    compliant,
    limitMin,
    limitMax,
  });

  return {
    id: `AN-${record.id}`,
    paramKey: record.paramKey,
    value: record.value,
    date: record.date,
    compliant: record.compliant,
  };
}
