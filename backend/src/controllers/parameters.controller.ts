import type { FastifyInstance } from "fastify";
import { parametersResponseJsonSchema } from "../schemas/parameters.schema.js";
import { listParameters } from "../services/parameters.service.js";

/**
 * Registra as rotas de parâmetros monitorados.
 */
export function parametersController(app: FastifyInstance): void {
  app.get(
    "/parameters",
    {
      schema: {
        summary:
          "Lista os parâmetros monitorados e seus limites CONAMA 430/2011",
        response: {
          200: parametersResponseJsonSchema,
        },
      },
    },
    () => listParameters(),
  );
}
