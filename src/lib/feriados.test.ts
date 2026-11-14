import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarFeriados, ehFeriado, reiniciarCacheFeriados } from "./feriados";
import { isDiaUtil, listarDiasUnidade, subtrairDiasUteis } from "./datas";

const resposta = (corpo: unknown, ok = true) =>
  Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(corpo) } as Response);

beforeEach(() => {
  localStorage.clear();
  reiniciarCacheFeriados();
});

describe("feriados nacionais", () => {
  it("sem API, usa a lista fixa de 2026 (20/11 é feriado; 19/11 não)", () => {
    expect(ehFeriado(new Date(2026, 10, 20))).toBe(true);
    expect(ehFeriado(new Date(2026, 10, 19))).toBe(false);
  });

  it("busca na BrasilAPI uma vez por ano e guarda em cache", async () => {
    const buscar = vi.fn(() => resposta([
      { date: "2027-01-01", name: "Confraternização mundial", type: "national" },
      { date: "2027-02-09", name: "Carnaval", type: "national" },
    ]));
    await carregarFeriados(2027, buscar);
    await carregarFeriados(2027, buscar);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith("https://brasilapi.com.br/api/feriados/v1/2027");
    expect(ehFeriado(new Date(2027, 1, 9))).toBe(true);
    expect(JSON.parse(localStorage.getItem("acolhe-plus:feriados:2027") ?? "[]")).toContain("2027-01-01");
  });

  it("com a API fora do ar, não bloqueia e mantém a lista fixa", async () => {
    await expect(carregarFeriados(2026, () => Promise.reject(new Error("offline")))).resolves.toBeUndefined();
    await expect(carregarFeriados(2026, () => resposta({}, false))).resolves.toBeUndefined();
    expect(ehFeriado(new Date(2026, 10, 15))).toBe(true);
  });
});

describe("isDiaUtil", () => {
  it("é falso para sábado, domingo e feriado nacional", () => {
    expect(isDiaUtil(new Date(2026, 10, 14))).toBe(false); // sábado
    expect(isDiaUtil(new Date(2026, 10, 15))).toBe(false); // domingo e Proclamação da República
    expect(isDiaUtil(new Date(2026, 10, 20))).toBe(false); // sexta, Consciência Negra
    expect(isDiaUtil(new Date(2026, 10, 19))).toBe(true);
  });

  it("prazos em dias úteis pulam o feriado", () => {
    // Consulta seg. 23/11 09:00: 1 dia útil antes é qui. 19/11 (pula sex. 20/11, feriado, e o fim de semana).
    const prazo = subtrairDiasUteis(new Date(2026, 10, 23, 9), 1);
    expect([prazo.getDate(), prazo.getHours()]).toEqual([19, 9]);
    // 3 dias úteis antes: ter. 17/11.
    expect(subtrairDiasUteis(new Date(2026, 10, 23, 9), 3).getDate()).toBe(17);
  });

  it("o seletor de dias não lista dias não úteis", () => {
    const horario = (cdHorario: number, d: Date) => ({ cdHorario, cdUnidade: 1, dtHorario: d.toISOString(), nrDuracaoMin: 20, flOcupado: false });
    const dias = listarDiasUnidade([horario(1, new Date(2026, 10, 19, 9)), horario(2, new Date(2026, 10, 20, 9)), horario(3, new Date(2026, 10, 21, 9))], 1);
    expect(dias).toEqual(["2026-11-19"]);
  });
});
