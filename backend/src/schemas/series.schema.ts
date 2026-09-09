import { z } from "zod";
import { PARAM_KEYS } from "../domain/parameters.js";

/**
 * Schema Zod da querystring de `GET /series`. `param` fora dos 6 keys
 * monitorados vira 400 de validação Zod (não 404) — mesmo padrão de
 * `days` em src/schemas/common.schema.ts.
 */
export const seriesQuerySchema = z.object({
  param: z.enum(PARAM_KEYS),
  days: z.enum(["7", "30", "90"]),
});

export type SeriesQuery = z.infer<typeof seriesQuerySchema>;

export const seriesPointSchema = z.object({
  date: z.iso.datetime(),
  value: z.number(),
  compliant: z.boolean(),
});

export type SeriesPointDto = z.infer<typeof seriesPointSchema>;

export const seriesResponseSchema = z.object({
  param: z.enum(PARAM_KEYS),
  days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  points: z.array(seriesPointSchema),
});

export type SeriesResponse = z.infer<typeof seriesResponseSchema>;

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref".
 */
export const seriesQueryJsonSchema = z.toJSONSchema(seriesQuerySchema, {
  target: "draft-07",
});

export const seriesResponseJsonSchema = z.toJSONSchema(seriesResponseSchema, {
  target: "draft-07",
});
