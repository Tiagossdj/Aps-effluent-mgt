import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

vi.mock("../repositories/analyses.repository.js", () => ({
  insertAnalysis: vi.fn(),
  findAnalysesByDays: vi.fn(),
}));

import {
  findAnalysesByDays,
  insertAnalysis,
} from "../repositories/analyses.repository.js";
import { createAnalysis, listAnalyses } from "./analyses.service.js";

const pool = {} as Pool;

describe("createAnalysis", () => {
  it("avalia a conformidade e persiste o snapshot dos limites usados", async () => {
    vi.mocked(insertAnalysis).mockResolvedValue({
      id: 1029,
      paramKey: "dqo",
      value: 268,
      date: "2026-09-03T09:00:00Z",
      compliant: false,
    });

    const result = await createAnalysis(pool, {
      paramKey: "dqo",
      value: 268,
      dateUtcIso: "2026-09-03T09:00:00Z",
    });

    expect(insertAnalysis).toHaveBeenCalledWith(pool, {
      paramKey: "dqo",
      value: 268,
      dateUtcIso: "2026-09-03T09:00:00Z",
      compliant: false,
      limitMin: null,
      limitMax: 250,
    });
    expect(result).toEqual({
      id: "AN-1029",
      paramKey: "dqo",
      value: 268,
      date: "2026-09-03T09:00:00Z",
      compliant: false,
    });
  });

  it("marca conforme quando o valor está dentro do limite (pH com mínimo)", async () => {
    vi.mocked(insertAnalysis).mockResolvedValue({
      id: 5,
      paramKey: "ph",
      value: 7,
      date: "2026-01-01T00:00:00Z",
      compliant: true,
    });

    const result = await createAnalysis(pool, {
      paramKey: "ph",
      value: 7,
      dateUtcIso: "2026-01-01T00:00:00Z",
    });

    expect(insertAnalysis).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({ limitMin: 5, limitMax: 9, compliant: true }),
    );
    expect(result.compliant).toBe(true);
  });

  it("marca não conforme quando o valor atinge exatamente o limite exclusivo (temperatura = 40)", async () => {
    vi.mocked(insertAnalysis).mockResolvedValue({
      id: 6,
      paramKey: "temperatura",
      value: 40,
      date: "2026-01-01T00:00:00Z",
      compliant: false,
    });

    await createAnalysis(pool, {
      paramKey: "temperatura",
      value: 40,
      dateUtcIso: "2026-01-01T00:00:00Z",
    });

    expect(insertAnalysis).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({ compliant: false, limitMax: 40 }),
    );
  });
});

describe("listAnalyses", () => {
  it("mapeia os registros para DTOs e monta o meta com days e count", async () => {
    vi.mocked(findAnalysesByDays).mockResolvedValue([
      {
        id: 1000,
        paramKey: "dqo",
        value: 268,
        date: "2026-09-03T09:00:00Z",
        compliant: false,
      },
      {
        id: 999,
        paramKey: "ph",
        value: 7,
        date: "2026-09-02T09:00:00Z",
        compliant: true,
      },
    ]);

    const result = await listAnalyses(pool, 30);

    expect(findAnalysesByDays).toHaveBeenCalledWith(pool, 30);
    expect(result).toEqual({
      data: [
        {
          id: "AN-1000",
          paramKey: "dqo",
          value: 268,
          date: "2026-09-03T09:00:00Z",
          compliant: false,
        },
        {
          id: "AN-999",
          paramKey: "ph",
          value: 7,
          date: "2026-09-02T09:00:00Z",
          compliant: true,
        },
      ],
      meta: { days: 30, count: 2 },
    });
  });

  it("retorna data vazio e count 0 quando não há análises no período", async () => {
    vi.mocked(findAnalysesByDays).mockResolvedValue([]);

    const result = await listAnalyses(pool, 7);

    expect(result).toEqual({ data: [], meta: { days: 7, count: 0 } });
  });
});
