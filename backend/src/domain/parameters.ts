/**
 * Parâmetros monitorados e seus limites conforme Resolução CONAMA 430/2011.
 * Fonte única da verdade — não recalcular ou duplicar esses valores em
 * outras camadas.
 */
export const PARAMETERS = [
  { key: "ph", label: "pH", unit: "", min: 5, max: 9, maxInclusive: true },
  {
    key: "dbo",
    label: "DBO 5 dias",
    unit: "mg/L",
    min: null,
    max: 120,
    maxInclusive: true,
  },
  {
    key: "dqo",
    label: "DQO",
    unit: "mg/L",
    min: null,
    max: 250,
    maxInclusive: true,
  },
  {
    key: "temperatura",
    label: "Temperatura",
    unit: "°C",
    min: null,
    max: 40,
    maxInclusive: false,
  },
  {
    key: "ss",
    label: "Sólidos suspensos",
    unit: "mg/L",
    min: null,
    max: 100,
    maxInclusive: true,
  },
  {
    key: "og",
    label: "Óleos e graxas",
    unit: "mg/L",
    min: null,
    max: 50,
    maxInclusive: true,
  },
] as const satisfies readonly {
  key: string;
  label: string;
  unit: string;
  min: number | null;
  max: number;
  maxInclusive: boolean;
}[];

export type ParamKey = (typeof PARAMETERS)[number]["key"];

export function getParameter(key: ParamKey): (typeof PARAMETERS)[number] {
  const parameter = PARAMETERS.find((p) => p.key === key);
  if (!parameter) {
    throw new Error(`Parâmetro desconhecido: ${key}`);
  }
  return parameter;
}
