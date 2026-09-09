import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { analysesController } from "./controllers/analyses.controller.js";
import { parametersController } from "./controllers/parameters.controller.js";
import type { Env } from "./config/env.js";

/**
 * Monta a aplicação Fastify (CORS, rate limit, Swagger, error handler)
 * sem chamar `listen` — permite testar a aplicação completa via
 * `app.inject` e reaproveitar a mesma composição no processo real
 * (src/server.ts). O `Pool` é injetado por quem compõe a aplicação (ver
 * src/db/pool.ts) e repassado às rotas que precisam do banco.
 */
export async function buildApp(env: Env, pool: Pool): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "API de Conformidade de Efluentes",
        description:
          "Registro de análises laboratoriais e avaliação de conformidade contra os limites da Resolução CONAMA 430/2011.",
        version: "1.0.0",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/documentation",
  });

  // `setNotFoundHandler`/`setErrorHandler` precisam ser registrados antes
  // dos controllers: o Fastify tira um "retrato" do contexto do plugin no
  // momento do `register()`, então handlers definidos depois não alcançam
  // rotas já registradas em contexto encapsulado.
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        message: "Rota não encontrada.",
        code: "NOT_FOUND",
      },
    });
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (request.validationError) {
      reply.status(400).send({
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    const statusCode = error.statusCode ?? 500;

    if (statusCode === 429) {
      reply.status(429).send({
        error: {
          message: error.message,
          code: "RATE_LIMITED",
        },
      });
      return;
    }

    if (statusCode >= 400 && statusCode < 500) {
      reply.status(statusCode).send({
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
        },
      });
      return;
    }

    request.log.error(error);
    reply.status(500).send({
      error: {
        message: "Erro interno do servidor.",
        code: "INTERNAL_ERROR",
      },
    });
  });

  await app.register(parametersController);
  await app.register(analysesController(pool));

  return app;
}
