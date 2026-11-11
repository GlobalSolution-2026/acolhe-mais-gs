import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { Consulta } from "@/types";
import { aceitarOfertaPorTelefone, agendarConsulta, buscarCidadaoPorCns, cancelarConsulta, conectarStore, confirmarConsulta, incluirNaListaDoDia, listarUnidades, registrarPresenca, salvarOrientacao, vincularOrientacao } from "./api";

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


describe("agendamento por oferta", () => {
  function preparar() {
    estado.cidadaos = [{ cdCidadao: 9, nmCidadao: "Maria", nrCns: "111222233334444", dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: "11999999999", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" }];
    estado.horarios = [{ cdHorario: 12, cdUnidade: 1, dtHorario: new Date(Date.now() + 48 * 3600000).toISOString(), nrDuracaoMin: 20, flOcupado: false }];
    estado.listaDoDia = [{ cdEntrada: 1, cdCidadao: 9, cdOrientacao: 4, cdUnidade: 1, nmCidadao: "Maria", dsCor: "VERDE", dtEntrada: new Date().toISOString(), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" }];
    estado.ofertas = [{ cdOferta: 1, cdHorario: 12, cdEntrada: 1, cdUnidade: 1, nmCidadao: "Maria", dtCriacao: new Date().toISOString(), status: "PENDENTE" }];
  }
  it("telefone cria consulta, ocupa horário e encerra oferta e entrada", async () => {
    preparar(); const promise = aceitarOfertaPorTelefone(1); await vi.runAllTimersAsync();
    const c = await promise;
    expect(c.cdCidadao).toBe(9);
    expect(c.cdOrientacao).toBe(4);
    expect(estado.horarios[0]?.flOcupado).toBe(true);
    expect(estado.ofertas[0]?.status).toBe("ACEITA");
    expect(estado.listaDoDia[0]?.status).toBe("ENCERRADA");
  });
  it("oferta expirada não agenda nem ocupa", async () => {
    preparar(); estado.ofertas = estado.ofertas.map((o) => ({ ...o, dtCriacao: new Date(Date.now() - 301000).toISOString() }));
    const promise = agendarConsulta({ cdHorario: 12, cdCidadao: 9, cdOrientacao: null, cdOferta: 1 });
    const rejection = expect(promise).rejects.toThrow("Esta oferta venceu ou foi repassada");
    await vi.runAllTimersAsync(); await rejection;
    expect(estado.horarios[0]?.flOcupado).toBe(false);
    expect(estado.consultas).toHaveLength(1);
  });
  it("duas reservas concorrentes ocupam uma única vaga", async () => {
    preparar(); const promises = [agendarConsulta({ cdHorario: 12, cdCidadao: 9, cdOrientacao: null }), agendarConsulta({ cdHorario: 12, cdCidadao: 9, cdOrientacao: null })];
    const results = Promise.allSettled(promises);
    await vi.runAllTimersAsync();
    expect((await results).map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(estado.consultas).toHaveLength(2);
  });
});

describe("balcão", () => {
  const maria = { cdCidadao: 9, nmCidadao: "Maria", nrCns: "111222233334444", dtNascimento: "1980-01-01", dsSexo: "F" as const, nrCelular: "11999999999", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" };
  const executar = async <T,>(p: Promise<T>) => { await vi.runAllTimersAsync(); return p; };

  it("busca o cidadão pelo CNS com ou sem máscara", async () => {
    estado.cidadaos = [maria];
    expect((await executar(buscarCidadaoPorCns("1112 2223 3334 444")))?.cdCidadao).toBe(9);
    expect(await executar(buscarCidadaoPorCns("999999999999999"))).toBeNull();
  });

  it("inclui na lista do dia com cor e orientação, sem duplicar quem já aguarda", async () => {
    estado.cidadaos = [maria];
    const entrada = await executar(incluirNaListaDoDia({ cdUnidade: 1, cdCidadao: 9, cdOrientacao: 4, dsCor: "AZUL" }));
    expect(entrada).toMatchObject({ cdEntrada: 1, cdCidadao: 9, cdOrientacao: 4, dsCor: "AZUL", nmCidadao: "Maria", flCidadao: false, status: "AGUARDANDO" });
    expect(estado.listaDoDia).toEqual([entrada]);
    const repetida = incluirNaListaDoDia({ cdUnidade: 1, cdCidadao: 9, cdOrientacao: 5, dsCor: "VERDE" });
    const rejeicao = expect(repetida).rejects.toThrow("já está na lista do dia");
    await vi.runAllTimersAsync(); await rejeicao;
    expect(estado.listaDoDia).toHaveLength(1);
  });

  it("vincula a orientação ao mesmo cidadão e recusa outro", async () => {
    estado.orientacoes = [{ cdOrientacao: 4, cdQueixa: 1, dsCor: "VERDE", dsDestino: "UBS", nrDor: 2, flElevadaModelo: false, dtOrientacao: new Date().toISOString() }];
    expect((await executar(vincularOrientacao(4, 9))).cdCidadao).toBe(9);
    expect((await executar(vincularOrientacao(4, 9))).cdCidadao).toBe(9);
    const outro = vincularOrientacao(4, 10);
    const rejeicao = expect(outro).rejects.toThrow("Código já utilizado.");
    await vi.runAllTimersAsync(); await rejeicao;
    expect(estado.orientacoes[0]?.cdCidadao).toBe(9);
  });
});

describe("cancelamento", () => {
  function preparar(horas: number, dsStatus: Consulta["dsStatus"] = "AGENDADA") {
    const dtHorario = new Date(Date.now() + horas * 3_600_000).toISOString();
    estado.horarios = [{ cdHorario: 12, cdUnidade: 1, dtHorario, nrDuracaoMin: 20, flOcupado: true }];
    estado.consultas = [{ ...original, dtHorario, dsStatus }];
  }
  it("libera a consulta futura e devolve o horário à agenda", async () => {
    preparar(48);
    const pendente = cancelarConsulta(7);
    await vi.runAllTimersAsync();
    expect((await pendente).dsStatus).toBe("LIBERADA");
    expect(estado.consultas[0]?.dsStatus).toBe("LIBERADA");
    expect(estado.horarios[0]?.flOcupado).toBe(false);
  });
  it.each([["REALIZADA", -2], ["AGENDADA", -1]] as const)("recusa consulta %s (%s h)", async (status, horas) => {
    preparar(horas, status);
    const pendente = cancelarConsulta(7);
    const rejeicao = expect(pendente).rejects.toThrow("não pode mais ser cancelada");
    await vi.runAllTimersAsync(); await rejeicao;
    expect(estado.consultas[0]?.dsStatus).toBe(status);
    expect(estado.horarios[0]?.flOcupado).toBe(true);
  });
});
