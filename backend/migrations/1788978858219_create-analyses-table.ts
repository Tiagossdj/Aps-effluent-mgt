import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

/**
 * Chaves válidas de `param_key`, espelhando PARAMETERS em
 * src/domain/parameters.ts — regra de negócio fixa da Resolução CONAMA
 * 430/2011 (ver CLAUDE.md).
 */
const PARAM_KEYS = ["ph", "dbo", "dqo", "temperatura", "ss", "og"] as const;

export function up(pgm: MigrationBuilder): void {
  pgm.createTable("analyses", {
    id: "id",
    param_key: {
      type: "text",
      notNull: true,
      check: `param_key IN (${PARAM_KEYS.map((key) => `'${key}'`).join(", ")})`,
    },
    value: {
      type: "numeric",
      notNull: true,
    },
    date: {
      type: "timestamp",
      notNull: true,
    },
    compliant: {
      type: "boolean",
      notNull: true,
    },
    limit_min: {
      type: "numeric",
      notNull: false,
    },
    limit_max: {
      type: "numeric",
      notNull: true,
    },
  });

  pgm.createIndex("analyses", "date");
  pgm.createIndex("analyses", ["param_key", "date"]);
}

export function down(pgm: MigrationBuilder): void {
  pgm.dropTable("analyses");
}
