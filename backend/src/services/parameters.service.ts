import { PARAMETERS } from "../domain/parameters.js";
import type { z } from "zod";
import type { parameterSchema } from "../schemas/parameters.schema.js";

export type ParameterDto = z.infer<typeof parameterSchema>;

/**
 * Lista os parâmetros monitorados e seus limites CONAMA 430/2011.
 * Dado estático de domínio — não há Repository/banco envolvido.
 */
export function listParameters(): ParameterDto[] {
  return [...PARAMETERS];
}
