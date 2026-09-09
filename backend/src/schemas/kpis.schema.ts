import { z } from "zod";

/**
 * Schema Zod da resposta de `GET /kpis`. A querystring reaproveita
 * `daysQuerySchema`/`daysQueryJsonSchema` de `common.schema.ts` — mesmo
 * padrão de `/analyses`, `/series` e `/alerts`.
 */
export const kpisResponseSchema = z.object({
  totalAnalyses: z.number(),
  complianceRate: z.number(),
  parametersInAlert: z.number(),
  lastCollectionAt: z.iso.datetime().nullable(),
});

export type KpisResponse = z.infer<typeof kpisResponseSchema>;

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref".
 */
export const kpisResponseJsonSchema = z.toJSONSchema(kpisResponseSchema, {
  target: "draft-07",
});
