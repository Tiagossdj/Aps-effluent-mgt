import { evaluateCompliance } from "../domain/compliance.js";
import { PARAM_KEYS, type ParamKey } from "../domain/parameters.js";
import type { NewAnalysis } from "../repositories/analyses.repository.js";

/** Quantidade de dias de histórico gerados pelo seed (ver CLAUDE.md). */
export const SEED_DAYS = 90;

/**
 * Seed fixa do PRNG: o seed de demonstração deve ser reprodutível — rodar
 * `pnpm seed` várias vezes produz sempre a mesma distribuição de valores,
 * o que evita perder um bom cenário de demo por causa de um resultado
 * aleatório "ruim" em uma nova execução.
 */
export const SEED_RANDOM_SEED = 20260909;

/** PRNG determinístico (mulberry32) — suficiente para gerar dados de demo. */
function createRandom(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Amostra de uma normal padrão (Box-Muller) a partir de `rand` uniforme. */
function gaussian(rand: () => number): number {
  const u1 = 1 - rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Valor "normal" (sempre dentro da faixa conforme do parâmetro). */
function compliantValue(
  rand: () => number,
  baseline: number,
  noiseStd: number,
  min: number,
  max: number,
): number {
  return round1(clamp(baseline + gaussian(rand) * noiseStd, min, max));
}

/**
 * Dias (contados como "há N dias" a partir de hoje) com não conformidade
 * forçada — garante que o feed de `/alerts` nunca fique vazio em nenhuma
 * das janelas de 7/30/90 dias, independentemente do resultado do PRNG.
 */
const FORCED_SPIKE_DAY_OFFSETS: Record<"dqo" | "og", readonly number[]> = {
  dqo: [1, 4, 10, 25, 50, 80],
  og: [2, 6, 15, 35, 60, 85],
};

/**
 * DQO: normalmente entre 30 e 230 mg/L (limite 250). Picos deliberados —
 * forçados em dias fixos e, adicionalmente, com 8% de chance em qualquer
 * outro dia — simulam lançamentos fora de conformidade (ver CLAUDE.md).
 */
function generateDqoValue(rand: () => number, dayOffset: number): number {
  const isSpike =
    FORCED_SPIKE_DAY_OFFSETS.dqo.includes(dayOffset) || rand() < 0.08;
  if (isSpike) {
    return round1(255 + rand() * 75);
  }
  return compliantValue(rand, 140, 45, 30, 230);
}

/**
 * Óleos e graxas: normalmente entre 5 e 46 mg/L (limite 50). Mesma lógica
 * de picos deliberados da DQO, em dias distintos.
 */
function generateOgValue(rand: () => number, dayOffset: number): number {
  const isSpike =
    FORCED_SPIKE_DAY_OFFSETS.og.includes(dayOffset) || rand() < 0.07;
  if (isSpike) {
    return round1(55 + rand() * 35);
  }
  return compliantValue(rand, 25, 10, 5, 46);
}

function generateValue(
  paramKey: ParamKey,
  rand: () => number,
  dayOffset: number,
): number {
  switch (paramKey) {
    case "ph":
      return compliantValue(rand, 7, 0.8, 5.2, 8.8);
    case "dbo":
      return compliantValue(rand, 55, 20, 10, 110);
    case "dqo":
      return generateDqoValue(rand, dayOffset);
    case "temperatura":
      return compliantValue(rand, 27, 4, 18, 37.5);
    case "ss":
      return compliantValue(rand, 55, 18, 10, 95);
    case "og":
      return generateOgValue(rand, dayOffset);
  }
}

/**
 * Gera `SEED_DAYS` dias de histórico (uma coleta por parâmetro por dia,
 * mais recente = `now`) com não conformidades deliberadas em DQO e Óleos
 * e graxas, necessárias para o feed de alertas não ficar vazio na
 * demonstração (ver CLAUDE.md). Determinístico: mesma `now`/`seed`
 * produzem sempre o mesmo resultado.
 */
export function generateSeedAnalyses(
  now: Date = new Date(),
  seed: number = SEED_RANDOM_SEED,
): NewAnalysis[] {
  const rand = createRandom(seed);
  const analyses: NewAnalysis[] = [];

  for (let dayOffset = SEED_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const dateUtcIso = new Date(
      now.getTime() - dayOffset * 24 * 60 * 60 * 1000,
    ).toISOString();

    for (const paramKey of PARAM_KEYS) {
      const value = generateValue(paramKey, rand, dayOffset);
      const { compliant, limitMin, limitMax } = evaluateCompliance(
        paramKey,
        value,
      );

      analyses.push({ paramKey, value, dateUtcIso, compliant, limitMin, limitMax });
    }
  }

  return analyses;
}
