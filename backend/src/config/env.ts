import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().min(1).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().min(1).default("1 minute"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export interface Env {
  DATABASE_URL: string;
  PORT: number;
  FRONTEND_URL: string;
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW: string;
  NODE_ENV: "development" | "test" | "production";
}

/**
 * Valida e normaliza as variáveis de ambiente do processo. `FRONTEND_URL`
 * é obrigatória em produção (CORS não pode cair para `origin: '*'`); em
 * outros ambientes, ausência de `FRONTEND_URL` assume o front-end local
 * padrão do projeto.
 */
export function loadEnv(source: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }

  const { FRONTEND_URL, NODE_ENV, ...rest } = parsed.data;

  if (NODE_ENV === "production" && !FRONTEND_URL) {
    throw new Error(
      "FRONTEND_URL é obrigatória quando NODE_ENV=production",
    );
  }

  return {
    ...rest,
    NODE_ENV,
    FRONTEND_URL: FRONTEND_URL ?? "http://localhost:3000",
  };
}
