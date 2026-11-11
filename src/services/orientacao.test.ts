import { afterEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "./api";
import type { Unidade } from "@/types";
import { concluirOrientacao, estadoMentalAlerta, ordenarUbsPorCep } from "./orientacao";

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

describe("ordenarUbsPorCep", () => {
  const ubs = (cdUnidade: number, nrCep: string): Unidade => ({ cdUnidade, nmUnidade: `UBS ${cdUnidade}`, tpUnidade: "UBS", dsEndereco: "", nrCep, nrTelefone: "" });
  it("mesmo prefixo de CEP primeiro, depois a menor distância", () => {
    const lista = [ubs(1, "09000-000"), ubs(2, "04500-000"), ubs(3, "04010-100"), ubs(4, "02000-000")];
    expect(ordenarUbsPorCep(lista, "04012-000").map((u) => u.cdUnidade)).toEqual([3, 2, 4, 1]);
    expect(lista.map((u) => u.cdUnidade)).toEqual([1, 2, 3, 4]);
  });
});

describe("concluirOrientacao: vínculo com o cadastro", () => {
  afterEach(() => vi.useRealTimers());
  async function concluir(cdCidadao?: number | null) {
    vi.useFakeTimers();
    let estado = { orientacoes: [] } as unknown as EstadoSimulador;
    conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
    const r = { PF1: "PARA_MIM", PF2: 30, SX: "F", DOR: 2, G0: "NAO", G1: "SIM" };
    const pendente = cdCidadao === undefined ? concluirOrientacao("GARGANTA", r) : concluirOrientacao("GARGANTA", r, cdCidadao);
    await vi.runAllTimersAsync();
    await pendente;
    return estado.orientacoes[0];
  }
  it("grava o cidadão quando informado (\"Para mim\" com login)", async () => {
    expect((await concluir(7))?.cdCidadao).toBe(7);
  });
  it("sem login, a orientação fica sem vínculo", async () => {
    expect((await concluir())?.cdCidadao).toBeNull();
  });
});
