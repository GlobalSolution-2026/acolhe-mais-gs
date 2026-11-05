import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => vi.resetModules());

it("preserva o contexto entre o Provider já carregado e consumidores reavaliados", async () => {
  const anterior = await import("./SimuladorContext");
  vi.resetModules();
  const atualizado = await import("./SimuladorContext");
  function Consumidor() {
    const { estado } = atualizado.useSimulador();
    return createElement("span", null, estado.cidadaos.length);
  }
  expect(() => renderToString(createElement(anterior.SimuladorProvider, null, createElement(Consumidor)))).not.toThrow();
});