import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { DaysQuery } from "../schemas/common.schema.js";
import { daysQueryJsonSchema, parseDays } from "../schemas/common.schema.js";
import { listAlertsResponseJsonSchema } from "../schemas/alerts.schema.js";
import { listAlerts } from "../services/alerts.service.js";

/**
 * Registra a rota de alertas (análises não conformes) do período. Recebe
 * o `Pool` já configurado (ver src/app.ts) e o repassa até a Service —
 * camada de composição, sem regra de negócio.
 */
export function alertsController(pool: Pool) {
  return function registerAlertsRoutes(app: FastifyInstance): void {
    app.get<{ Querystring: DaysQuery }>(
      "/alerts",
      {
        schema: {
          summary:
            "Lista as análises não conformes dos últimos 7, 30 ou 90 dias, mais recente primeiro",
          querystring: daysQueryJsonSchema,
          response: {
            200: listAlertsResponseJsonSchema,
          },
        },
      },
      async (request) => {
        const days = parseDays(request.query.days);
        return listAlerts(pool, days);
      },
    );
  };
}
