import { describe, expect, it } from "vitest";
import { PARAMETERS, getParameter } from "./parameters.js";

describe("PARAMETERS", () => {
  it("contém exatamente os 6 parâmetros monitorados, na ordem definida", () => {
    expect(PARAMETERS.map((p) => p.key)).toEqual([
      "ph",
      "dbo",
      "dqo",
      "temperatura",
      "ss",
      "og",
    ]);
  });

  it("reflete os limites da Resolução CONAMA 430/2011 sem alteração", () => {
    expect(PARAMETERS).toEqual([
      { key: "ph", label: "pH", unit: "", min: 5, max: 9, maxInclusive: true },
      {
        key: "dbo",
        label: "DBO 5 dias",
        unit: "mg/L",
        min: null,
        max: 120,
        maxInclusive: true,
      },
      {
        key: "dqo",
        label: "DQO",
        unit: "mg/L",
        min: null,
        max: 250,
        maxInclusive: true,
      },
      {
        key: "temperatura",
        label: "Temperatura",
        unit: "°C",
        min: null,
        max: 40,
        maxInclusive: false,
      },
      {
        key: "ss",
        label: "Sólidos suspensos",
        unit: "mg/L",
        min: null,
        max: 100,
        maxInclusive: true,
      },
      {
        key: "og",
        label: "Óleos e graxas",
        unit: "mg/L",
        min: null,
        max: 50,
        maxInclusive: true,
      },
    ]);
  });
});

describe("getParameter", () => {
  it("retorna o parâmetro correspondente à chave", () => {
    expect(getParameter("temperatura")).toEqual({
      key: "temperatura",
      label: "Temperatura",
      unit: "°C",
      min: null,
      max: 40,
      maxInclusive: false,
    });
  });
});
