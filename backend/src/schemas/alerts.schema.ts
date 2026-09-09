import { z } from "zod";
import { PARAM_KEYS } from "../domain/parameters.js";

/**
 * Schema Zod da resposta de `GET /alerts`. A querystring reaproveita
 * `daysQuerySchema`/`daysQueryJsonSchema` de `common.schema.ts` — mesmo
 * padrão de `/analyses`, `/series` e `/kpis`. Sem campo `compliant`: por
 * definição, todo item de `/alerts` é não conforme.
 */
export const alertResponseSchema = z.object({
  id: z.string(),
  paramKey: z.enum(PARAM_KEYS),
  value: z.number(),
  date: z.iso.datetime(),
});

export type AlertDto = z.infer<typeof alertResponseSchema>;

export const listAlertsResponseSchema = z.object({
  data: z.array(alertResponseSchema),
  meta: z.object({
    days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    count: z.number(),
  }),
});

export type ListAlertsResponse = z.infer<typeof listAlertsResponseSchema>;

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref".
 */
export const listAlertsResponseJsonSchema = z.toJSONSchema(
  listAlertsResponseSchema,
  { target: "draft-07" },
);
