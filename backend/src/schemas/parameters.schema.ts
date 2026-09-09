import { z } from "zod";
import { PARAM_KEYS } from "../domain/parameters.js";

/**
 * Schema Zod de um parâmetro monitorado — fonte única de verdade para
 * validação e para o JSON Schema exposto ao Fastify/Swagger.
 */
export const parameterSchema = z.object({
  key: z.enum(PARAM_KEYS),
  label: z.string(),
  unit: z.string(),
  min: z.number().nullable(),
  max: z.number(),
  maxInclusive: z.boolean(),
});

export const parametersResponseSchema = z.array(parameterSchema);

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref" assim que o schema é usado num `body`.
 */
export const parametersResponseJsonSchema = z.toJSONSchema(
  parametersResponseSchema,
  { target: "draft-07" },
);
