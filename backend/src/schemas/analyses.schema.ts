import { z } from "zod";
import { PARAM_KEYS } from "../domain/parameters.js";

/**
 * Schema Zod do corpo de `POST /analyses`. `date` é opcional (default:
 * `now()` em UTC, aplicado na Service) — a rejeição de data futura não é
 * expressável em JSON Schema estático e é feita explicitamente no
 * Controller.
 */
export const createAnalysisBodySchema = z.object({
  paramKey: z.enum(PARAM_KEYS),
  value: z.number(),
  date: z.iso.datetime().optional(),
});

export type CreateAnalysisBody = z.infer<typeof createAnalysisBodySchema>;

export const analysisResponseSchema = z.object({
  id: z.string(),
  paramKey: z.enum(PARAM_KEYS),
  value: z.number(),
  date: z.iso.datetime(),
  compliant: z.boolean(),
});

export type AnalysisDto = z.infer<typeof analysisResponseSchema>;

export const listAnalysesResponseSchema = z.object({
  data: z.array(analysisResponseSchema),
  meta: z.object({
    days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    count: z.number(),
  }),
});

export type ListAnalysesResponse = z.infer<typeof listAnalysesResponseSchema>;

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação do
 * body com "no schema with key or ref".
 */
export const createAnalysisBodyJsonSchema = z.toJSONSchema(
  createAnalysisBodySchema,
  { target: "draft-07" },
);

export const analysisResponseJsonSchema = z.toJSONSchema(
  analysisResponseSchema,
  { target: "draft-07" },
);

export const listAnalysesResponseJsonSchema = z.toJSONSchema(
  listAnalysesResponseSchema,
  { target: "draft-07" },
);
