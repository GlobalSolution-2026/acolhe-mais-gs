import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Testes não acessam a rede: a BrasilAPI "falha" e vale a lista fixa de feriados.
const fetchOriginal = globalThis.fetch;
globalThis.fetch = ((entrada: RequestInfo | URL, init?: RequestInit) =>
  String(entrada).includes("brasilapi.com.br")
    ? Promise.reject(new Error("sem rede nos testes"))
    : fetchOriginal(entrada, init)) as typeof fetch;

// Data fixa em dia útil (qua., 18/11/2026, 10:00) para os testes não dependerem do dia em que rodam;
// só o Date é falso, os timers continuam reais. Quem precisa de outra data usa vi.setSystemTime.
// A simulação do próximo dia útil fica desligada; os testes do modo demonstração a ligam.
import { definirSimulacaoDiaUtil } from "@/lib/relogio";
import { afterEach, beforeEach, vi } from "vitest";
export const DATA_TESTES = new Date(2026, 10, 18, 10, 0, 0);
// Também no carregamento: alguns testes guardam "hoje" no topo do módulo.
vi.useFakeTimers({ toFake: ["Date"] });
vi.setSystemTime(DATA_TESTES);
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DATA_TESTES);
  definirSimulacaoDiaUtil(false, false);
});
afterEach(() => {
  vi.useRealTimers();
});
