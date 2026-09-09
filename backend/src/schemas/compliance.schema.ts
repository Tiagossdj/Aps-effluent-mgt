import { z } from "zod";
import { PARAM_KEYS } from "../domain/parameters.js";

/**
 * Schema Zod do corpo de `POST /compliance/preview`. Mesmo padrão de
 * `paramKey`/`value` já usado em `POST /analyses` — sem `date`, já que
 * este endpoint não persiste nada.
 */
export const previewComplianceBodySchema = z.object({
  paramKey: z.enum(PARAM_KEYS),
  value: z.number(),
});

export type PreviewComplianceBody = z.infer<typeof previewComplianceBodySchema>;

export const previewComplianceResponseSchema = z.object({
  compliant: z.boolean(),
  limitMin: z.number().nullable(),
  limitMax: z.number(),
});

export type PreviewComplianceResponse = z.infer<
  typeof previewComplianceResponseSchema
>;

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref".
 */
export const previewComplianceBodyJsonSchema = z.toJSONSchema(
  previewComplianceBodySchema,
  { target: "draft-07" },
);

export const previewComplianceResponseJsonSchema = z.toJSONSchema(
  previewComplianceResponseSchema,
  { target: "draft-07" },
);
