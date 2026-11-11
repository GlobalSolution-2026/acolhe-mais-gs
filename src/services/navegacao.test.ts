import { describe, expect, it } from "vitest";
import { destinoAposLogin, lerDestinoLogin } from "./navegacao";

describe("destinoAposLogin", () => {
  it("o agendamento tem prioridade e mantém a oferta", () => {
    expect(destinoAposLogin({ horario: 12, oferta: 3, destino: "lista-do-dia" })).toEqual({ to: "/cidadao/agendar", search: { horario: 12, oferta: 3 } });
  });
  it.each([
    ["ficha", "/cidadao/perfil/ficha"],
    ["lista-do-dia", "/cidadao/lista-do-dia"],
    ["", "/cidadao/perfil"],
  ] as const)("destino '%s' volta para %s", (destino, to) => {
    expect(destinoAposLogin({ horario: 0, oferta: 0, destino })).toEqual({ to });
  });
});

describe("lerDestinoLogin", () => {
  it("aceita só destinos conhecidos", () => {
    expect(lerDestinoLogin("ficha")).toBe("ficha");
    expect(lerDestinoLogin("lista-do-dia")).toBe("lista-do-dia");
    expect(lerDestinoLogin("/qualquer")).toBe("");
    expect(lerDestinoLogin(undefined)).toBe("");
    expect(lerDestinoLogin(5)).toBe("");
  });
});
