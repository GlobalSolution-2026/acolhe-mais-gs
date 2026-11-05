import { describe, expect, it } from "vitest";
import type { Cidadao, Consulta, EntradaListaDoDia } from "@/types";
import {
  calcularIndicadores,
  deveLiberar,
  dispensadaConfirmacao,
  inicioPedidoConfirmacao,
  ordenarListaDoDia,
  posicaoNaFila,
  prazoConfirmacao,
  precisaConfirmar,
  temContatoValido,
} from "./regrasAgendamento";

const HORA = 3_600_000;
const base = new Date("2026-11-10T12:00:00.000Z");

function consulta(parcial: Partial<Consulta> = {}): Consulta {
  return {
    cdConsulta: 1,
    cdHorario: 1,
    cdCidadao: 1,
    cdOrientacao: null,
    dtAgendamento: new Date(base.getTime() - 10 * 24 * HORA).toISOString(),
    dtConfirmacao: null,
    dsCanalConfirmacao: null,
    dsStatus: "AGENDADA",
    vlProbFalta: 0.2,
    dsRiscoFalta: "BAIXO",
    nmUnidade: "UBS",
    dtHorario: new Date(base.getTime() + 5 * 24 * HORA).toISOString(), // daqui a 5 dias
    ...parcial,
  };
}

const comContato: Pick<Cidadao, "nrCelular" | "nrContatoRecado"> = { nrCelular: "(11) 90000-0000", nrContatoRecado: "" };
const semContato: Pick<Cidadao, "nrCelular" | "nrContatoRecado"> = { nrCelular: "", nrContatoRecado: "" };

describe("prazo de confirmação por risco", () => {
  it("risco BAIXO: pedido 48 h antes e prazo final 24 h antes", () => {
    const c = consulta({ dsRiscoFalta: "BAIXO" });
    const horario = new Date(c.dtHorario).getTime();
    expect(inicioPedidoConfirmacao(c)?.getTime()).toBe(horario - 48 * HORA);
    expect(prazoConfirmacao(c)?.getTime()).toBe(horario - 24 * HORA);
  });

  it("risco ALTO: pedido 72 h antes (com lembrete) e prazo final 24 h antes", () => {
    const c = consulta({ dsRiscoFalta: "ALTO" });
    const horario = new Date(c.dtHorario).getTime();
    expect(inicioPedidoConfirmacao(c)?.getTime()).toBe(horario - 72 * HORA);
    expect(prazoConfirmacao(c)?.getTime()).toBe(horario - 24 * HORA);
  });

  it("consulta marcada com menos de 24 h dispensa confirmação", () => {
    const c = consulta({
      dtAgendamento: base.toISOString(),
      dtHorario: new Date(base.getTime() + 12 * HORA).toISOString(),
    });
    expect(dispensadaConfirmacao(c)).toBe(true);
    expect(inicioPedidoConfirmacao(c)).toBeNull();
    expect(prazoConfirmacao(c)).toBeNull();
    expect(precisaConfirmar(c, base)).toBe(false);
  });

  it("precisaConfirmar só dentro da janela entre o pedido e o prazo", () => {
    const c = consulta({ dsRiscoFalta: "BAIXO" }); // horário daqui a 5 dias
    const dentroDaJanela = new Date(new Date(c.dtHorario).getTime() - 30 * HORA);
    const depoisDoPrazo = new Date(new Date(c.dtHorario).getTime() - 12 * HORA);
    expect(precisaConfirmar(c, base)).toBe(false); // pedido ainda não enviado
    expect(precisaConfirmar(c, dentroDaJanela)).toBe(true);
    expect(precisaConfirmar(c, depoisDoPrazo)).toBe(false);
    expect(precisaConfirmar(consulta({ dsStatus: "CONFIRMADA" }), dentroDaJanela)).toBe(false);
  });
});

describe("liberação de não confirmados", () => {
  const depoisDoPrazo = new Date(base.getTime() + 5 * 24 * HORA); // após o prazo final

  it("não confirmada até o prazo vira LIBERADA quando há contato válido", () => {
    expect(deveLiberar(consulta(), comContato, depoisDoPrazo)).toBe(true);
  });

  it("paciente sem nenhum contato válido não tem a vaga liberada", () => {
    expect(deveLiberar(consulta(), semContato, depoisDoPrazo)).toBe(false);
    expect(deveLiberar(consulta(), undefined, depoisDoPrazo)).toBe(false);
  });

  it("antes do prazo, nada é liberado", () => {
    expect(deveLiberar(consulta(), comContato, base)).toBe(false);
  });

  it("consulta já confirmada nunca é liberada", () => {
    expect(deveLiberar(consulta({ dsStatus: "CONFIRMADA" }), comContato, depoisDoPrazo)).toBe(false);
  });

  it("contato de recado sozinho já conta como contato válido", () => {
    expect(temContatoValido({ nrCelular: "", nrContatoRecado: "(11) 90000-0000" })).toBe(true);
    expect(temContatoValido(semContato)).toBe(false);
  });
});

describe("ordenação da lista do dia", () => {
  const entrada = (cdEntrada: number, dsCor: "VERDE" | "AZUL", minutos: number, flPrioridade = false): EntradaListaDoDia => ({
    cdEntrada,
    cdCidadao: cdEntrada,
    cdUnidade: 1,
    nmCidadao: `P${cdEntrada}`,
    dsCor,
    dtEntrada: new Date(base.getTime() + minutos * 60_000).toISOString(),
    flPrioridade,
    flCidadao: false,
    status: "AGUARDANDO",
  });

  it("verde antes de azul; dentro da cor, ordem de chegada", () => {
    const fila = ordenarListaDoDia([
      entrada(1, "AZUL", 0),
      entrada(2, "VERDE", 10),
      entrada(3, "VERDE", 5),
      entrada(4, "AZUL", 2),
    ]);
    expect(fila.map((e) => e.cdEntrada)).toEqual([3, 2, 1, 4]);
  });

  it("quem ficou de um dia para o outro tem prioridade", () => {
    const fila = ordenarListaDoDia([entrada(1, "VERDE", 0), entrada(2, "AZUL", 5, true)]);
    expect(fila.map((e) => e.cdEntrada)).toEqual([2, 1]);
  });

  it("encerrados saem da fila e a posição é 1-based", () => {
    const lista = [entrada(1, "VERDE", 0), { ...entrada(2, "VERDE", 5), status: "ENCERRADA" as const }, entrada(3, "AZUL", 2)];
    expect(ordenarListaDoDia(lista).map((e) => e.cdEntrada)).toEqual([1, 3]);
    expect(posicaoNaFila(lista, 3)).toBe(2);
    expect(posicaoNaFila(lista, 2)).toBe(0);
  });
});

describe("indicadores", () => {
  it("calcula absenteísmo, reaproveitamento, não encaixados e comparecimento após orientação", () => {
    const consultas: Consulta[] = [
      consulta({ cdConsulta: 1, dsStatus: "REALIZADA", cdOrientacao: 1 }),
      consulta({ cdConsulta: 2, dsStatus: "FALTA", cdOrientacao: 1 }),
      consulta({ cdConsulta: 3, dsStatus: "LIBERADA", cdHorario: 50, dtAgendamento: new Date(base.getTime() - 2 * HORA).toISOString() }),
      consulta({ cdConsulta: 4, dsStatus: "AGENDADA", cdHorario: 50, dtAgendamento: base.toISOString() }), // reocupou o horário 50
      consulta({ cdConsulta: 5, dsStatus: "LIBERADA", cdHorario: 51 }),
    ];
    const lista: EntradaListaDoDia[] = [
      { cdEntrada: 1, cdCidadao: 1, cdUnidade: 1, nmCidadao: "A", dsCor: "VERDE", dtEntrada: base.toISOString(), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
      { cdEntrada: 2, cdCidadao: 2, cdUnidade: 1, nmCidadao: "B", dsCor: "AZUL", dtEntrada: base.toISOString(), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
    ];
    const i = calcularIndicadores(consultas, lista);
    expect(i.taxaAbsenteismo).toBeCloseTo(1 / 2);
    expect(i.taxaReaproveitamento).toBeCloseTo(1 / 2);
    expect(i.naoEncaixadas).toBe(2);
    expect(i.comparecimentoAposOrientacao).toBeCloseTo(1 / 2);
  });

  it("retorna null quando não há base de cálculo", () => {
    const i = calcularIndicadores([], []);
    expect(i.taxaAbsenteismo).toBeNull();
    expect(i.taxaReaproveitamento).toBeNull();
    expect(i.comparecimentoAposOrientacao).toBeNull();
    expect(i.naoEncaixadas).toBe(0);
  });
});
