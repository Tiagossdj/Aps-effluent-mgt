import { describe, expect, it } from "vitest";
import { evaluateCompliance } from "../domain/compliance.js";
import { previewCompliance } from "./compliance.service.js";

describe("previewCompliance", () => {
  it("delega para evaluateCompliance sem alterar o resultado", () => {
    expect(previewCompliance("dqo", 268)).toEqual(
      evaluateCompliance("dqo", 268),
    );
  });

  it("é conforme exatamente no limite superior do pH (9)", () => {
    expect(previewCompliance("ph", 9)).toEqual({
      compliant: true,
      limitMin: 5,
      limitMax: 9,
    });
  });

  it("não é conforme exatamente em 40°C (limite exclusivo)", () => {
    expect(previewCompliance("temperatura", 40)).toEqual({
      compliant: false,
      limitMin: null,
      limitMax: 40,
    });
  });
});
