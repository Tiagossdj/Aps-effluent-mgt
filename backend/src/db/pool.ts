import { Pool, types } from "pg";

/**
 * Cria um pool de conexões Postgres a partir de uma connection string.
 * Injetável: nenhuma camada lê `process.env` diretamente aqui — quem
 * compõe a aplicação decide de onde vem a connection string (permite
 * apontar Repository/testes para bancos diferentes sem singleton global).
 *
 * A coluna `date` usa `timestamp` sem timezone. Sem este parser custom,
 * o node-pg reinterpretaria o texto naive devolvido pelo Postgres como
 * horário local do processo Node (não UTC), quebrando a garantia de que
 * toda leitura/escrita é tratada como UTC pela aplicação (ver CLAUDE.md).
 * Devolvendo o texto bruto aqui, a conversão para ISO 8601 UTC fica a
 * cargo de src/db/timestamp.ts.
 */
export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    types: {
      getTypeParser: (oid, format): ((value: string) => unknown) =>
        oid === types.builtins.TIMESTAMP
          ? (value: string) => value
          : (types.getTypeParser(oid, format) as (value: string) => unknown),
    },
  });
}
