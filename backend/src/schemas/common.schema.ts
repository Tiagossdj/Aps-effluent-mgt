import { z } from "zod";

/**
 * Query string `days` compartilhada por /analyses, /series, /kpis e
 * /alerts. Chega sempre como texto (query string) — o AJV do Fastify
 * (`coerceTypes: "array"`, ver @fastify/ajv-compiler) não converte
 * string em number, então o enum é validado como texto e convertido
 * explicitamente por `parseDays`.
 */
export const daysQuerySchema = z.object({
  days: z.enum(["7", "30", "90"]),
});

export type DaysQuery = z.infer<typeof daysQuerySchema>;

export function parseDays(days: DaysQuery["days"]): 7 | 30 | 90 {
  return Number(days) as 7 | 30 | 90;
}

/**
 * `target: "draft-07"` porque o AJV embutido no Fastify (via
 * @fastify/ajv-compiler) só resolve o meta-schema draft-07 por padrão —
 * o draft 2020-12 (default do Zod) falha ao compilar a validação com
 * "no schema with key or ref".
 */
export const daysQueryJsonSchema = z.toJSONSchema(daysQuerySchema, {
  target: "draft-07",
});
