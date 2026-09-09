import { pathToFileURL } from "node:url";

/**
 * Ponto de entrada do processo Node do backend.
 * O listen HTTP do Fastify entra na fase de configuração da aplicação.
 */
export function start(): void {
  return;
}

const entryPath = process.argv[1];
const isDirectRun =
  entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href;

if (isDirectRun) {
  start();
}
