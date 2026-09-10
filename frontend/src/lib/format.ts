// Helpers de formatação para exibição — sem lógica de negócio (isso é do backend).

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
