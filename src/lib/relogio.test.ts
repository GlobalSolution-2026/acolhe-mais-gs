import { afterEach, describe, expect, it, vi } from "vitest";
import { agora, definirSimulacaoDiaUtil, diaSimulado } from "./relogio";
import { fmtDiaSemanaData } from "./datas";

afterEach(() => definirSimulacaoDiaUtil(false, false));

describe("relógio do modo demonstração", () => {
  it("no sábado, simula o próximo dia útil no mesmo horário (pula o domingo/feriado de 15/11)", () => {
    vi.setSystemTime(new Date(2026, 10, 14, 10, 30));
    definirSimulacaoDiaUtil(true, false);
    const simulado = diaSimulado();
    expect(simulado && [simulado.getDate(), simulado.getHours(), simulado.getMinutes()]).toEqual([16, 10, 30]);
    expect(agora().getDate()).toBe(16);
    expect(fmtDiaSemanaData(agora())).toBe("segunda-feira, 16/11");
  });

  it("em dia útil, ou com a simulação desligada, vale a data real", () => {
    vi.setSystemTime(new Date(2026, 10, 19, 10));
    definirSimulacaoDiaUtil(true, false);
    expect(diaSimulado()).toBeNull();
    vi.setSystemTime(new Date(2026, 10, 20, 10)); // feriado (sexta)
    expect(agora().getDate()).toBe(23);
    definirSimulacaoDiaUtil(false, false);
    expect(agora().getDate()).toBe(20);
  });
});
