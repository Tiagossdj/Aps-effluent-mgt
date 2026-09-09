import { describe, expect, it } from "vitest";
import { main } from "./run.js";

describe("entrada do seed", () => {
  it("exporta main como função assíncrona", () => {
    expect(typeof main).toBe("function");
  });

  it("recusa rodar quando NODE_ENV=production, para não apagar dados reais por engano", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      await expect(main()).rejects.toThrow(/production/i);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
