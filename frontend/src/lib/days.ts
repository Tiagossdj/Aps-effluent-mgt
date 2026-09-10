import type { Days } from "./types";

export const VALID_DAYS: readonly Days[] = [7, 30, 90];

export const DEFAULT_DAYS: Days = 30;

// O querystring `?days=` é a fonte da verdade do período selecionado (link
// público, precisa sobreviver a reload) — nunca lido de estado local.
export function parseDaysParam(
  value: string | string[] | undefined,
): Days | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "7" || raw === "30" || raw === "90") {
    return Number(raw) as Days;
  }
  return null;
}
