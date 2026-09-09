import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { SeriesQuery } from "../schemas/series.schema.js";
import {
  seriesQueryJsonSchema,
  seriesResponseJsonSchema,
} from "../schemas/series.schema.js";
import { parseDays } from "../schemas/common.schema.js";
import { getSeries } from "../services/series.service.js";

/**
 * Registra a rota de série temporal de um parâmetro. Recebe o `Pool` já
 * configurado (ver src/app.ts) e o repassa até a Service — camada de
 * composição, sem regra de negócio.
 */
export function seriesController(pool: Pool) {
  return function registerSeriesRoutes(app: FastifyInstance): void {
    app.get<{ Querystring: SeriesQuery }>(
      "/series",
      {
        schema: {
          summary:
            "Série temporal de um parâmetro nos últimos 7, 30 ou 90 dias, mais antiga primeiro",
          querystring: seriesQueryJsonSchema,
          response: {
            200: seriesResponseJsonSchema,
          },
        },
      },
      async (request) => {
        const { param } = request.query;
        const days = parseDays(request.query.days);
        return getSeries(pool, param, days);
      },
    );
  };
}
