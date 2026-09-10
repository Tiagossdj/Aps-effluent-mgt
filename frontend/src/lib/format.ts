// Helpers de formatação para exibição — sem lógica de negócio (isso é do backend).

import type { Parameter } from "./types";

// Timezone fixo em America/Sao_Paulo: a página é um Server Component e o
// horário local do servidor de renderização não tem relação com o fuso da
// ETE monitorada, então não dá para confiar no timezone padrão do runtime.
const TIMEZONE = "America/Sao_Paulo";

export function formatLastCollection(iso: string | null): string {
  if (iso === null) {
    return "Sem coletas";
  }

  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("day")}/${get("month")} ${get("hour")}:${get("minute")}`;
}

// Texto do limite legal a partir de min/max/maxInclusive — só formatação de
// exibição, a regra de conformidade em si é sempre do backend.
export function formatLimitText(parameter: Parameter): string {
  const { min, max, maxInclusive, unit } = parameter;

  if (min !== null) {
    return `${min} a ${max}`;
  }

  const operator = maxInclusive ? "≤" : "<";
  return unit ? `${operator} ${max} ${unit}` : `${operator} ${max}`;
}

// pH (único parâmetro com `min` definido, ver domínio do backend) exibe 2
// casas decimais; os demais, 1 casa.
export function formatParameterValue(parameter: Parameter, value: number): string {
  const fractionDigits = parameter.min !== null ? 2 : 1;
  const formattedNumber = value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return parameter.unit ? `${formattedNumber} ${parameter.unit}` : formattedNumber;
}

export function formatMaxLabel(parameter: Parameter): string {
  return parameter.unit ? `${parameter.max} ${parameter.unit}` : `${parameter.max}`;
}
