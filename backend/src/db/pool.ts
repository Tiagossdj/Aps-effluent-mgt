import { Pool } from "pg";

/**
 * Cria um pool de conexões Postgres a partir de uma connection string.
 * Injetável: nenhuma camada lê `process.env` diretamente aqui — quem
 * compõe a aplicação decide de onde vem a connection string (permite
 * apontar Repository/testes para bancos diferentes sem singleton global).
 */
export function createPool(connectionString: string): Pool {
  return new Pool({ connectionString });
}
