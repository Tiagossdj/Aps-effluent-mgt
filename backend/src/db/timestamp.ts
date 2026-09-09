/**
 * Conversão entre ISO 8601 UTC (usado pela aplicação) e o literal naive
 * gravado na coluna `date` (`timestamp` sem timezone). A coluna nunca
 * carrega um sufixo de fuso: gravamos os dígitos UTC como texto literal e
 * lemos de volta o mesmo texto (ver src/db/pool.ts, que desativa o parser
 * padrão do node-pg para não reinterpretar o valor como horário local do
 * processo Node).
 */

/** Remove o sufixo `Z` de um ISO 8601 UTC para gravar como literal naive. */
export function toNaiveUtcLiteral(isoUtc: string): string {
  return isoUtc.endsWith("Z") ? isoUtc.slice(0, -1) : isoUtc;
}

/**
 * Converte o texto bruto devolvido pelo Postgres para `timestamp`
 * (formato `YYYY-MM-DD HH:MM:SS[.ffffff]`) para ISO 8601 UTC.
 */
export function fromNaiveUtcLiteral(raw: string): string {
  return `${raw.replace(" ", "T")}Z`;
}
