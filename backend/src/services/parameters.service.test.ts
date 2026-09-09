import { describe, expect, it } from "vitest";
import { PARAMETERS } from "../domain/parameters.js";
import { listParameters } from "./parameters.service.js";

describe("listParameters", () => {
  it("retorna os 6 parâmetros monitorados do domínio, sem alteração", () => {
    expect(listParameters()).toEqual(PARAMETERS);
  });

  it("retorna uma cópia — não expõe a referência interna do domínio", () => {
    expect(listParameters()).not.toBe(PARAMETERS);
  });
});
