import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import type { CreateAnalysisBody } from "../schemas/analyses.schema.js";
import {
  analysisResponseJsonSchema,
  createAnalysisBodyJsonSchema,
} from "../schemas/analyses.schema.js";
import { createAnalysis } from "../services/analyses.service.js";

/**
 * Registra as rotas de análises laboratoriais. Recebe o `Pool` já
 * configurado (ver src/app.ts) e o repassa até a Service — camada de
 * composição, sem regra de negócio.
 */
export function analysesController(pool: Pool) {
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
  };
}
