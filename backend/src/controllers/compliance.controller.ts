import type { FastifyInstance } from "fastify";
import type { PreviewComplianceBody } from "../schemas/compliance.schema.js";
import {
  previewComplianceBodyJsonSchema,
  previewComplianceResponseJsonSchema,
} from "../schemas/compliance.schema.js";
import { previewCompliance } from "../services/compliance.service.js";

/**
 * Registra a rota de pré-visualização de conformidade. Não recebe
 * `Pool` — não toca o banco — e por isso fica disponível em todos os
 * ambientes, inclusive produção.
 */
export function complianceController(app: FastifyInstance): void {
  app.post<{ Body: PreviewComplianceBody }>(
    "/compliance/preview",
    {
      schema: {
        summary:
          "Avalia a conformidade de um valor hipotético contra os limites CONAMA 430/2011, sem persistir nada",
        body: previewComplianceBodyJsonSchema,
        response: {
          200: previewComplianceResponseJsonSchema,
        },
      },
    },
    (request) => {
      const { paramKey, value } = request.body;
      return previewCompliance(paramKey, value);
    },
  );
}
