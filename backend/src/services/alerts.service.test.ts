import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";

vi.mock("../repositories/analyses.repository.js", () => ({
  findAlertsByDays: vi.fn(),
}));

import { findAlertsByDays } from "../repositories/analyses.repository.js";
import { listAlerts } from "./alerts.service.js";

const pool = {} as Pool;

describe("listAlerts", () => {
  it("mapeia os registros para AN-<id> e monta meta com days/count", async () => {
    vi.mocked(findAlertsByDays).mockResolvedValue([
      {
        id: 1000,
        paramKey: "dqo",
        value: 268,
        date: "2026-09-03T09:00:00Z",
        compliant: false,
      },
    ]);

    const result = await listAlerts(pool, 30);

    expect(findAlertsByDays).toHaveBeenCalledWith(pool, 30);
    expect(result).toEqual({
      data: [
        {
          id: "AN-1000",
          paramKey: "dqo",
          value: 268,
          date: "2026-09-03T09:00:00Z",
        },
      ],
      meta: { days: 30, count: 1 },
    });
  });

  it("retorna data vazio e count 0 quando não há não conformidades", async () => {
    vi.mocked(findAlertsByDays).mockResolvedValue([]);

    const result = await listAlerts(pool, 7);

    expect(result).toEqual({
      data: [],
      meta: { days: 7, count: 0 },
    });
  });
});
