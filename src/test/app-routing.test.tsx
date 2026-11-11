import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { EditarPerfil } from "@/pages/cidadao/EditarPerfil";
import { Route as InicioRedirect } from "@/routes/index";
import { Route as CidadaoRedirect } from "@/routes/cidadao.index";
import { Route as RecepcaoRedirect } from "@/routes/recepcao.index";
import { rotaPai } from "@/services/navegacao";

const router = createRouter({ routeTree });
const cidadao = ["inicio", "orientacao", "resultado", "ubs", "agendar", "sucesso", "lista-do-dia", "consultas", "emergencia", "avisos", "perfil"];
const recepcao = ["agenda", "balcao", "pendentes", "lista-do-dia", "indicadores"];

describe("navegação por perfil", () => {
  it.each([
    [InicioRedirect, "/cidadao/inicio"],
    [CidadaoRedirect, "/cidadao/inicio"],
    [RecepcaoRedirect, "/recepcao/agenda"],
  ])("redireciona a entrada ao destino fixo", (route, destino) => {
    expect(route.options.beforeLoad).toBeTypeOf("function");
    const beforeLoad = route.options.beforeLoad;
    if (typeof beforeLoad !== "function") throw new Error("Redirecionamento ausente");
    try {
      Reflect.apply(beforeLoad, undefined, []);
      throw new Error("Deveria redirecionar");
    } catch (erro) {
      expect(erro).toMatchObject({ options: { to: destino } });
    }
  });

  it.each([
    ...cidadao.map((tela) => [`/cidadao/${tela}`, `/cidadao/${tela}`, "/cidadao"]),
    ["/cidadao/ubs/1", "/cidadao/ubs_/$cdUnidade", "/cidadao"],
    ["/cidadao/perfil/editar", "/cidadao/perfil_/editar", "/cidadao"],
    ...recepcao.map((tela) => [`/recepcao/${tela}`, `/recepcao/${tela}`, "/recepcao"]),
  ])("%s abre uma tela do layout correto", (caminho, id, layout) => {
    const matches = router.matchRoutes(caminho);
    expect(matches.at(-1)?.routeId).toBe(id);
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.map((m) => m.routeId)).toContain(layout);
    expect(Object.values(router.routesById).find((route) => route.id === id)?.options.component).toBeDefined();
  });

  it("edição abre EditarPerfil, sem ficar dentro da tela Perfil", () => {
    const matches = router.matchRoutes("/cidadao/perfil/editar");
    expect(matches.map((m) => m.routeId)).toEqual([rootRouteId, "/cidadao", "/cidadao/perfil_/editar"]);
    expect(router.routesById["/cidadao/perfil_/editar"].options.component).toBe(EditarPerfil);
  });
});

describe("rotaPai", () => {
  it.each([
    ["/cidadao/orientacao", "/cidadao/inicio"],
    ["/cidadao/resultado", "/cidadao/inicio"],
    ["/cidadao/ubs", "/cidadao/resultado"],
    ["/cidadao/ubs/3", "/cidadao/ubs"],
    ["/cidadao/agendar", "/cidadao/ubs"],
    ["/cidadao/sucesso", "/cidadao/consultas"],
    ["/cidadao/lista-do-dia", "/cidadao/ubs"],
    ["/cidadao/perfil/editar", "/cidadao/perfil"],
  ])("%s volta para %s", (caminho, pai) => expect(rotaPai(caminho)).toBe(pai));

  it("agendamento volta aos horários da UBS escolhida", () => {
    expect(rotaPai("/cidadao/agendar", 3)).toBe("/cidadao/ubs/$cdUnidade");
  });

  it.each([...cidadao.filter((t) => ["inicio", "consultas", "emergencia", "avisos", "perfil"].includes(t)).map((t) => `/cidadao/${t}`), ...recepcao.map((t) => `/recepcao/${t}`)])("%s não tem voltar", (caminho) => {
    expect(rotaPai(caminho)).toBeNull();
  });
});
