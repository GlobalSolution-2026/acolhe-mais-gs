import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { Consulta } from "@/types";
import { conectarStore, confirmarConsulta, listarUnidades, registrarPresenca, salvarOrientacao } from "./api";

const original: Consulta = {
  cdConsulta: 7, cdHorario: 12, cdCidadao: 9, cdOrientacao: 3,
  dtAgendamento: "2026-11-01T10:00:00Z", dtHorario: "2026-11-12T10:00:00Z",
  dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus: "AGENDADA",
  vlProbFalta: 0.7, dsRiscoFalta: "ALTO", nmUnidade: "UBS de teste",
};
let estado: EstadoSimulador;

beforeEach(() => {
  vi.useFakeTimers();
  estado = {
    dtSemente: "2026-11-05",
    unidades: [
      { cdUnidade: 1, nmUnidade: "UBS", tpUnidade: "UBS", dsEndereco: "Rua A", nrCep: "01000-000", nrTelefone: "1133333333" },
      { cdUnidade: 2, nmUnidade: "UPA", tpUnidade: "UPA", dsEndereco: "Rua B", nrCep: "01000-001", nrTelefone: "1133333334" },
    ],
    horarios: [], cidadaos: [], consultas: [{ ...original }], cdUnidadeRecepcao: 1,
    orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [], cdCidadaoAtual: null,
  };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});
afterEach(() => vi.useRealTimers());

describe("contratos dos serviços", () => {
  it("filtra unidades no front sem alterar a lista completa", async () => {
    const pendente = listarUnidades("UBS");
    await vi.runAllTimersAsync();
    expect((await pendente).map((u) => u.cdUnidade)).toEqual([1]);
    expect(estado.unidades).toHaveLength(2);
  });

  it("salva a orientação apenas no estado da demonstração", async () => {
    const dados = { cdQueixa: 1, dsCor: "VERDE" as const, dsDestino: "UBS" as const, nrDor: 3, flElevadaModelo: false };
    const pendente = salvarOrientacao(dados);
    await vi.runAllTimersAsync();
    const salva = await pendente;
    expect(salva).toMatchObject({ ...dados, cdOrientacao: 1 });
    expect(estado.orientacoes).toEqual([salva]);
  });

  it("confirmar usa a consulta completa com canal e data novos", async () => {
    const pendente = confirmarConsulta(7, "TELEFONE");
    await vi.runAllTimersAsync();
    const atualizada = await pendente;
    expect(atualizada).toEqual({ ...original, dsStatus: "CONFIRMADA", dsCanalConfirmacao: "TELEFONE", dtConfirmacao: expect.any(String) });
    expect(estado.consultas).toEqual([atualizada]);
  });

  it.each(["REALIZADA", "FALTA"] as const)("registrar %s preserva todos os campos da consulta", async (status) => {
    const pendente = registrarPresenca(7, status);
    await vi.runAllTimersAsync();
    expect(await pendente).toEqual({ ...original, dsStatus: status });
    expect(estado.consultas).toEqual([{ ...original, dsStatus: status }]);
  });
});
