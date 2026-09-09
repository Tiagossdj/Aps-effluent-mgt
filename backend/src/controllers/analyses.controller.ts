import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { Env } from "../config/env.js";
import type { DaysQuery } from "../schemas/common.schema.js";
import { daysQueryJsonSchema, parseDays } from "../schemas/common.schema.js";
import type { CreateAnalysisBody } from "../schemas/analyses.schema.js";
import {
  analysisResponseJsonSchema,
  createAnalysisBodyJsonSchema,
  listAnalysesResponseJsonSchema,
} from "../schemas/analyses.schema.js";
import { createAnalysis, listAnalyses } from "../services/analyses.service.js";

/**
 * Registra as rotas de análises laboratoriais. Recebe o `Pool` já
 * configurado (ver src/app.ts) e o repassa até a Service — camada de
 * composição, sem regra de negócio. `nodeEnv` é usado só para bloquear
 * escrita em produção (modo de demonstração pública) — não há sistema
 * de autenticação envolvido.
 */
export function analysesController(pool: Pool, nodeEnv: Env["NODE_ENV"]) {
  return function registerAnalysesRoutes(app: FastifyInstance): void {
    app.post<{ Body: CreateAnalysisBody }>(
      "/analyses",
      {
        schema: {
          summary:
            "Registra uma análise laboratorial e avalia sua conformidade CONAMA 430/2011",
          body: createAnalysisBodyJsonSchema,
          response: {
            201: analysisResponseJsonSchema,
          },
        },
      },
      async (request, reply) => {
        if (nodeEnv === "production") {
          reply.status(403).send({
            error: {
              message:
                "Escrita desabilitada em produção — use POST /compliance/preview para testar valores sem persistir.",
              code: "WRITE_DISABLED_IN_PRODUCTION",
            },
          });
          return;
        }

        const { paramKey, value } = request.body;
        const dateUtcIso = request.body.date ?? new Date().toISOString();

        if (new Date(dateUtcIso).getTime() > Date.now()) {
          reply.status(400).send({
            error: {
              message: "A data da análise não pode estar no futuro.",
              code: "VALIDATION_ERROR",
            },
          });
          return;
        }

        const analysis = await createAnalysis(pool, {
          paramKey,
          value,
          dateUtcIso,
        });

        reply.status(201).send(analysis);
      },
    );

    app.get<{ Querystring: DaysQuery }>(
      "/analyses",
      {
        schema: {
          summary:
            "Lista as análises dos últimos 7, 30 ou 90 dias, mais recente primeiro",
          querystring: daysQueryJsonSchema,
          response: {
            200: listAnalysesResponseJsonSchema,
          },
        },
      },
      async (request) => {
        const days = parseDays(request.query.days);
        return listAnalyses(pool, days);
      },
    );
  };
}
