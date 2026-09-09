import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { DaysQuery } from "../schemas/common.schema.js";
import { daysQueryJsonSchema, parseDays } from "../schemas/common.schema.js";
import { kpisResponseJsonSchema } from "../schemas/kpis.schema.js";
import { getKpis } from "../services/kpis.service.js";

/**
 * Registra a rota de KPIs do período. Recebe o `Pool` já configurado (ver
 * src/app.ts) e o repassa até a Service — camada de composição, sem
 * regra de negócio.
 */
export function kpisController(pool: Pool) {
  return function registerKpisRoutes(app: FastifyInstance): void {
    app.get<{ Querystring: DaysQuery }>(
      "/kpis",
      {
        schema: {
          summary:
            "KPIs do período: total de análises, taxa de conformidade, parâmetros em alerta e última coleta",
          querystring: daysQueryJsonSchema,
          response: {
            200: kpisResponseJsonSchema,
          },
        },
      },
      async (request) => {
        const days = parseDays(request.query.days);
        return getKpis(pool, days);
      },
    );
  };
}
