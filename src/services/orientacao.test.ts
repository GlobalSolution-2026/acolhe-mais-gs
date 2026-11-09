import { describe, expect, it } from "vitest";
import { estadoMentalAlerta } from "./orientacao";

describe("estadoMentalAlerta", () => {
  it.each(["P4", "D3a", "U1"])("%s com confusão, sonolência ou desmaio indica alteração do estado mental", (codigo) => {
    for (const valor of ["CONFUSO", "SONOLENTO", "DESMAIOU"]) expect(estadoMentalAlerta({ [codigo]: [valor] })).toBe(false);
  });
  it("C3 só conta a confusão", () => {
    expect(estadoMentalAlerta({ C3: ["CONFUSAO"] })).toBe(false);
    expect(estadoMentalAlerta({ C3: ["FALA", "BOCA", "VISAO", "FRAQUEZA_LADO"] })).toBe(true);
  });
  it("pele fria na U1 não é estado mental", () => {
    expect(estadoMentalAlerta({ U1: ["PELE_FRIA"] })).toBe(true);
  });
  it.each(["P4", "D3a", "C3", "U1"])("%s = Nenhum destes ou sem resposta: alerta", (codigo) => {
    expect(estadoMentalAlerta({ [codigo]: ["NENHUM"] })).toBe(true);
    expect(estadoMentalAlerta({})).toBe(true);
  });
  it("respostas antigas em texto e o código D3 não são considerados", () => {
    expect(estadoMentalAlerta({ D3a: "SIM" })).toBe(true);
    expect(estadoMentalAlerta({ D3: ["CONFUSO"] })).toBe(true);
  });
});
