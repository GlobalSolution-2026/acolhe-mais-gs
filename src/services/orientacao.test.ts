import { describe, expect, it } from "vitest";
import { estadoMentalAlerta } from "./orientacao";

describe("estadoMentalAlerta", () => {
  it("D3a = Sim indica alteração do estado mental", () => {
    expect(estadoMentalAlerta({ D3a: "SIM" })).toBe(false);
  });
  it("o código antigo D3 não é considerado", () => {
    expect(estadoMentalAlerta({ D3: "SIM" })).toBe(true);
  });
  it("sem respostas, o estado mental é alerta", () => {
    expect(estadoMentalAlerta({})).toBe(true);
  });
  it.each(["P4", "C3", "U1"])("%s = Sim indica alteração do estado mental", (codigo) => {
    expect(estadoMentalAlerta({ [codigo]: "SIM" })).toBe(false);
    expect(estadoMentalAlerta({ [codigo]: "NAO" })).toBe(true);
  });
});
