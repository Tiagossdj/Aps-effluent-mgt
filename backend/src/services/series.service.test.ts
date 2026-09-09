import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

vi.mock("../repositories/analyses.repository.js", () => ({
  findSeriesByParamAndDays: vi.fn(),
}));

import { findSeriesByParamAndDays } from "../repositories/analyses.repository.js";
import { getSeries } from "./series.service.js";

const pool = {} as Pool;

describe("getSeries", () => {
  it("mapeia os registros para pontos e monta a resposta com param e days", async () => {
    vi.mocked(findSeriesByParamAndDays).mockResolvedValue([
      { date: "2026-08-04T09:00:00Z", value: 98, compliant: true },
      { date: "2026-08-05T09:00:00Z", value: 130, compliant: false },
    ]);

    const result = await getSeries(pool, "dbo", 30);

    expect(findSeriesByParamAndDays).toHaveBeenCalledWith(pool, "dbo", 30);
    expect(result).toEqual({
      param: "dbo",
      days: 30,
      points: [
        { date: "2026-08-04T09:00:00Z", value: 98, compliant: true },
        { date: "2026-08-05T09:00:00Z", value: 130, compliant: false },
      ],
    });
  });

  it("retorna points vazio quando não há análises do parâmetro no período", async () => {
    vi.mocked(findSeriesByParamAndDays).mockResolvedValue([]);

    const result = await getSeries(pool, "ph", 7);

    expect(result).toEqual({ param: "ph", days: 7, points: [] });
  });
});
