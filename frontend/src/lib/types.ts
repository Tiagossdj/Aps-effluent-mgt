// Tipos espelhando o contrato de resposta da API Fastify (ver backend/CLAUDE.md
// e backend/src/schemas/*.ts). Qualquer mudança aqui deve ser refletida lá.

export type Days = 7 | 30 | 90;

export type ParamKey = "ph" | "dbo" | "dqo" | "temperatura" | "ss" | "og";

export interface Parameter {
  key: ParamKey;
  label: string;
  unit: string;
  min: number | null;
  max: number;
  maxInclusive: boolean;
}

export interface AnalysisDto {
  id: string;
  paramKey: ParamKey;
  value: number;
  date: string;
  compliant: boolean;
}

export interface ListAnalysesResponse {
  data: AnalysisDto[];
  meta: {
    days: Days;
    count: number;
  };
}

export interface KpisResponse {
  totalAnalyses: number;
  complianceRate: number;
  parametersInAlert: number;
  lastCollectionAt: string | null;
}

export interface AlertDto {
  id: string;
  paramKey: ParamKey;
  value: number;
  date: string;
}

export interface ListAlertsResponse {
  data: AlertDto[];
  meta: {
    days: Days;
    count: number;
  };
}

export interface SeriesPointDto {
  date: string;
  value: number;
  compliant: boolean;
}

export interface SeriesResponse {
  param: ParamKey;
  days: Days;
  points: SeriesPointDto[];
}

export interface PreviewComplianceBody {
  paramKey: ParamKey;
  value: number;
}

export interface PreviewComplianceResponse {
  compliant: boolean;
  limitMin: number | null;
  limitMax: number;
}
