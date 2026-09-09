import { z } from "zod";
import { PARAMETERS } from "../domain/parameters.js";

const paramKeys = PARAMETERS.map((p) => p.key) as [string, ...string[]];

/**
 * Schema Zod de um parâmetro monitorado — fonte única de verdade para
 * validação e para o JSON Schema exposto ao Fastify/Swagger.
 */
export const parameterSchema = z.object({
  key: z.enum(paramKeys),
  label: z.string(),
  unit: z.string(),
  min: z.number().nullable(),
  max: z.number(),
  maxInclusive: z.boolean(),
});

export const parametersResponseSchema = z.array(parameterSchema);

export const parametersResponseJsonSchema = z.toJSONSchema(
  parametersResponseSchema,
);
