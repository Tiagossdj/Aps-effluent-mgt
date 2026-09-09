import { describe, expect, it } from "vitest";
import { start } from "./server.js";

describe("entrada do servidor", () => {
  it("exporta start como função assíncrona", () => {
    expect(typeof start).toBe("function");
  });
});
