import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

vi.mock("../repositories/analyses.repository.js", () => ({
  findKpisByDays: vi.fn(),
}));

import { findKpisByDays } from "../repositories/analyses.repository.js";
import { getKpis } from "./kpis.service.js";

const pool = {} as Pool;

describe("getKpis", () => {
  it("calcula complianceRate a partir de compliantCount/totalAnalyses", async () => {
    vi.mocked(findKpisByDays).mockResolvedValue({
      totalAnalyses: 28,
      compliantCount: 23,
      parametersInAlert: 2,
      lastCollectionAt: "2026-09-03T09:00:00Z",
    });

    const result = await getKpis(pool, 30);

    expect(findKpisByDays).toHaveBeenCalledWith(pool, 30);
    expect(result).toEqual({
      totalAnalyses: 28,
      complianceRate: 82.1,
      parametersInAlert: 2,
      lastCollectionAt: "2026-09-03T09:00:00Z",
    });
  });

  it("repassa parametersInAlert (contagem de param_key distintos) sem recalcular", async () => {
    vi.mocked(findKpisByDays).mockResolvedValue({
      totalAnalyses: 10,
      compliantCount: 6,
      parametersInAlert: 3,
      lastCollectionAt: "2026-09-03T09:00:00Z",
    });

    const result = await getKpis(pool, 7);

    expect(result.parametersInAlert).toBe(3);
  });

  it("retorna o formato de período sem dados quando totalAnalyses é 0", async () => {
    vi.mocked(findKpisByDays).mockResolvedValue({
      totalAnalyses: 0,
      compliantCount: 0,
      parametersInAlert: 0,
      lastCollectionAt: null,
    });

    const result = await getKpis(pool, 7);

    expect(result).toEqual({
      totalAnalyses: 0,
      complianceRate: 0,
      parametersInAlert: 0,
      lastCollectionAt: null,
    });
  });
});
