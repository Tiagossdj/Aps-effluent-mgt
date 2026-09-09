/**
 * Calcula `(part / total) * 100` arredondado para uma casa decimal com
 * arredondamento half-up (ex.: 82.05 → 82.1). Usa aritmética inteira em
 * vez de `Math.round(x * 10) / 10` porque frações decimais como `0.05`
 * não são representáveis exatamente em double — `82.05` pode ser
 * armazenado como `82.04999999999999`, fazendo `Math.round` arredondar
 * para baixo indevidamente.
 */
export function compliancePercentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  const scaledNumerator = part * 1000;
  const quotient = Math.floor(scaledNumerator / total);
  const remainder = scaledNumerator - quotient * total;
  const roundedTenths = remainder * 2 >= total ? quotient + 1 : quotient;

  return roundedTenths / 10;
}
