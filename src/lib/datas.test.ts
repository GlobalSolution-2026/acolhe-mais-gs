import { describe, expect, it } from "vitest";
import { idadeEm } from "./datas";

describe("idadeEm", () => {
  it("conta anos completos depois do aniversário do ano", () => {
    expect(idadeEm("1990-06-15", new Date(2026, 10, 9))).toBe(36);
  });
  it("antes do aniversário do ano ainda não completou", () => {
    expect(idadeEm("1990-06-15", new Date(2026, 1, 1))).toBe(35);
  });
  // Cobre o erro de fuso do cálculo antigo do api.ts (new Date("AAAA-MM-DD") é UTC e,
  // em UTC-3, antecipava o aniversário para as 21h da véspera).
  it("na véspera do aniversário, até 23:59, a idade não muda (sem efeito de fuso)", () => {
    expect(idadeEm("1990-06-15", new Date(2026, 5, 14, 21, 0))).toBe(35);
    expect(idadeEm("1990-06-15", new Date(2026, 5, 14, 23, 59))).toBe(35);
  });
  it("no dia do aniversário, desde 00:00, a idade aumenta", () => {
    expect(idadeEm("1990-06-15", new Date(2026, 5, 15, 0, 0))).toBe(36);
  });
  it("aceita data ISO completa e recusa data inválida", () => {
    expect(idadeEm("1990-06-15T00:00:00.000Z", new Date(2026, 10, 9))).toBe(36);
    expect(idadeEm("", new Date(2026, 10, 9))).toBeNull();
    expect(idadeEm("abc", new Date(2026, 10, 9))).toBeNull();
  });
});
