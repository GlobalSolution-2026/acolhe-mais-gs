import { describe, expect, it } from "vitest";
import type { Cidadao, Consulta, EntradaListaDoDia } from "@/types";
import type { Orientacao } from "@/types/orientacao";
import {
  acoesPresenca,
  calcularIndicadores,
  consultaNoDia,
  orientacaoDoDia,
  podeCancelar,
  listarPendentesConfirmacao,
  deveLiberar,
  dispensadaConfirmacao,
  inicioPedidoConfirmacao,
  ordenarListaDoDia,
  posicaoNaFila,
  orientacoesDoDia,
  prazoConfirmacao,
  prazoVencidoSemContato,
  precisaConfirmar,
  temContatoValido,
} from "./regrasAgendamento";
import { ehDiaUtil, subtrairDiasUteis } from "@/lib/datas";

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
  it("risco BAIXO, consulta de terça: pedido na sexta (2 dias úteis) e prazo na segunda (1 dia útil)", () => {
    const c = consulta({ dsRiscoFalta: "BAIXO", dtHorario: new Date("2026-11-17T09:00:00").toISOString() });
    expect(inicioPedidoConfirmacao(c)?.getTime()).toBe(new Date("2026-11-13T09:00:00").getTime());
    expect(prazoConfirmacao(c)?.getTime()).toBe(new Date("2026-11-16T09:00:00").getTime());
  });

  it("risco ALTO, consulta de segunda: pedido na quarta (3 dias úteis, com lembrete) e prazo na sexta", () => {
    const c = consulta({ dsRiscoFalta: "ALTO", dtHorario: new Date("2026-11-16T09:00:00").toISOString() });
    expect(inicioPedidoConfirmacao(c)?.getTime()).toBe(new Date("2026-11-11T09:00:00").getTime());
    expect(prazoConfirmacao(c)?.getTime()).toBe(new Date("2026-11-13T09:00:00").getTime());
  });

  it("nenhum pedido nem prazo cai no fim de semana", () => {
    for (const dia of [16, 17, 18, 19, 20]) for (const risco of ["BAIXO", "ALTO"] as const) {
      const c = consulta({ dsRiscoFalta: risco, dtHorario: new Date(`2026-11-${dia}T14:00:00`).toISOString() });
      expect(ehDiaUtil(inicioPedidoConfirmacao(c) ?? new Date(0))).toBe(true);
      expect(ehDiaUtil(prazoConfirmacao(c) ?? new Date(0))).toBe(true);
    }
  });

  it("subtrairDiasUteis pula o fim de semana e mantém o horário", () => {
    expect(subtrairDiasUteis(new Date("2026-11-16T09:00:00"), 1).getTime()).toBe(new Date("2026-11-13T09:00:00").getTime());
    expect(subtrairDiasUteis(new Date("2026-11-18T15:30:00"), 3).getTime()).toBe(new Date("2026-11-13T15:30:00").getTime());
    expect(subtrairDiasUteis(new Date("2026-11-13T09:00:00"), 0).getTime()).toBe(new Date("2026-11-13T09:00:00").getTime());
  });

  it("consulta marcada depois do prazo final dispensa confirmação (segunda 10:00 para terça 09:00)", () => {
    const c = consulta({ dtAgendamento: new Date("2026-11-16T10:00:00").toISOString(), dtHorario: new Date("2026-11-17T09:00:00").toISOString() });
    expect(dispensadaConfirmacao(c)).toBe(true);
    expect(dispensadaConfirmacao({ ...c, dtAgendamento: new Date("2026-11-16T08:00:00").toISOString() })).toBe(false);
  });

  it("consulta marcada com menos de 1 dia útil de antecedência dispensa confirmação", () => {
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
    const c = consulta({ dsRiscoFalta: "BAIXO", dtHorario: new Date("2026-11-17T09:00:00").toISOString() }); // terça
    const dentroDaJanela = new Date("2026-11-14T12:00:00"); // sábado, entre o pedido (sexta) e o prazo (segunda)
    const depoisDoPrazo = new Date("2026-11-16T10:00:00");
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
    cdOrientacao: cdEntrada,
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
      consulta({ cdConsulta: 1, dsStatus: "REALIZADA", cdOrientacao: 1, dtHorario: new Date(base.getTime() - HORA).toISOString() }),
      consulta({ cdConsulta: 2, dsStatus: "FALTA", cdOrientacao: 1, dtHorario: new Date(base.getTime() - HORA).toISOString() }),
      consulta({ cdConsulta: 3, dsStatus: "LIBERADA", cdHorario: 50, dtAgendamento: new Date(base.getTime() - 2 * HORA).toISOString() }),
      consulta({ cdConsulta: 4, dsStatus: "AGENDADA", cdHorario: 50, dtAgendamento: base.toISOString() }), // reocupou o horário 50
      consulta({ cdConsulta: 5, dsStatus: "LIBERADA", cdHorario: 51 }),
    ];
    const lista: EntradaListaDoDia[] = [
      { cdEntrada: 1, cdCidadao: 1, cdOrientacao: 1, cdUnidade: 1, nmCidadao: "A", dsCor: "VERDE", dtEntrada: base.toISOString(), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
      { cdEntrada: 2, cdCidadao: 2, cdOrientacao: 2, cdUnidade: 1, nmCidadao: "B", dsCor: "AZUL", dtEntrada: base.toISOString(), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
    ];
    const i = calcularIndicadores(consultas, lista, base);
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

  it("absenteísmo exclui futuras e liberadas mesmo com status encerrado inconsistente", () => {
    const passadas = [consulta({ dsStatus: "REALIZADA", dtHorario: new Date(base.getTime() - HORA).toISOString() }), consulta({ dsStatus: "FALTA", dtHorario: new Date(base.getTime() - HORA).toISOString() })];
    const outras = [consulta({ dsStatus: "FALTA" }), consulta({ dsStatus: "CONFIRMADA" }), consulta({ dsStatus: "LIBERADA", dtHorario: new Date(base.getTime() - HORA).toISOString() })];
    expect(calcularIndicadores([...passadas, ...outras], [], base).taxaAbsenteismo).toBe(.5);
    expect(calcularIndicadores(outras, [], base).taxaAbsenteismo).toBeNull();
  });
});

describe("pendentes e sino", () => {
  it("somente janela atual, ALTO primeiro e prazo depois, da UBS selecionada", () => {
    const c = (id: number, horas: number, risco: "ALTO" | "BAIXO" = "BAIXO", status: Consulta["dsStatus"] = "AGENDADA") => consulta({ cdConsulta: id, cdHorario: id, dtHorario: new Date(base.getTime() + horas * HORA).toISOString(), dsRiscoFalta: risco, dsStatus: status });
    const consultas = [c(1, 30), c(2, 60, "ALTO"), c(3, 40, "ALTO"), c(4, 90), c(5, 10), c(6, 30, "BAIXO", "CONFIRMADA"), c(7, 30)];
    const horarios = consultas.map((c) => ({ cdHorario: c.cdHorario, cdUnidade: c.cdConsulta === 7 ? 2 : 1, dtHorario: c.dtHorario, flOcupado: true, nrDuracaoMin: 20 }));
    expect(listarPendentesConfirmacao(consultas, horarios, [cidComContato], 1, base).map((c) => c.cdConsulta)).toEqual([3, 2, 1]);
  });

  it("mantém, no topo, as de prazo vencido sem contato que ainda não aconteceram", () => {
    const c = (id: number, cdCidadao: number, horas: number, status: Consulta["dsStatus"] = "AGENDADA") =>
      consulta({ cdConsulta: id, cdHorario: id, cdCidadao, dtHorario: new Date(base.getTime() + horas * HORA).toISOString(), dsStatus: status });
    const consultas = [c(1, 1, 30), c(2, 2, 10), c(3, 1, 10), c(4, 2, -2), c(5, 2, 10, "CONFIRMADA"), c(6, 9, 8), c(7, 2, 9)];
    const horarios = consultas.map((x) => ({ cdHorario: x.cdHorario, cdUnidade: 1, dtHorario: x.dtHorario, flOcupado: true, nrDuracaoMin: 20 }));
    // 2: sem contato (vencida); 9: sem cadastro (vencida); 1: com contato (vencida não entra).
    expect(listarPendentesConfirmacao(consultas, horarios, [cidComContato, cidSemContato], 1, base).map((x) => x.cdConsulta)).toEqual([6, 7, 2, 1]);
  });
});

const cidComContato: Cidadao = { cdCidadao: 1, nmCidadao: "Com", nrCns: "1", dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" };
const cidSemContato: Cidadao = { ...cidComContato, cdCidadao: 2, nmCidadao: "Sem", nrCelular: "", nrContatoRecado: "" };

describe("prazoVencidoSemContato", () => {
  const vencida = consulta({ dtHorario: new Date(base.getTime() + 10 * HORA).toISOString() });
  it("vencida, sem contato (ou sem cadastro) e ainda por acontecer", () => {
    expect(prazoVencidoSemContato(vencida, cidSemContato, base)).toBe(true);
    expect(prazoVencidoSemContato(vencida, undefined, base)).toBe(true);
  });
  it("não vale com contato, confirmada, já passada, antes do prazo ou dispensada", () => {
    expect(prazoVencidoSemContato(vencida, cidComContato, base)).toBe(false);
    expect(prazoVencidoSemContato({ ...vencida, nrContatoRecado: "" } as Consulta, { nrCelular: "", nrContatoRecado: "(11) 96666-0000" }, base)).toBe(false);
    expect(prazoVencidoSemContato({ ...vencida, dsStatus: "CONFIRMADA" }, cidSemContato, base)).toBe(false);
    expect(prazoVencidoSemContato({ ...vencida, dtHorario: new Date(base.getTime() - HORA).toISOString() }, cidSemContato, base)).toBe(false);
    expect(prazoVencidoSemContato({ ...vencida, dtHorario: new Date(base.getTime() + 24 * 6 * HORA).toISOString() }, cidSemContato, base)).toBe(false);
    expect(prazoVencidoSemContato({ ...vencida, dtAgendamento: new Date(base.getTime() - HORA).toISOString() }, cidSemContato, base)).toBe(false);
  });
});
it("comparecimento após orientação exclui futuras, liberadas e não encerradas", () => {
  const passado = new Date(base.getTime() - HORA).toISOString();
  const consultas = [consulta({ dsStatus: "REALIZADA", cdOrientacao: 1, dtHorario: passado }), consulta({ dsStatus: "FALTA", cdOrientacao: 2, dtHorario: passado }), consulta({ dsStatus: "LIBERADA", cdOrientacao: 3, dtHorario: passado }), consulta({ dsStatus: "REALIZADA", cdOrientacao: 4 }), consulta({ dsStatus: "FALTA", cdOrientacao: 5 }), consulta({ dsStatus: "AGENDADA", cdOrientacao: 6, dtHorario: passado }), consulta({ dsStatus: "REALIZADA", dtHorario: passado })];
  expect(calcularIndicadores(consultas, [], base).comparecimentoAposOrientacao).toBe(.5);
  expect(calcularIndicadores(consultas.slice(2), [], base).comparecimentoAposOrientacao).toBeNull();
});

describe("podeCancelar", () => {
  const agora = new Date("2026-11-11T10:00:00Z");
  const futura = "2026-11-12T10:00:00Z";
  it.each(["AGENDADA", "CONFIRMADA"] as const)("%s futura pode ser cancelada", (dsStatus) => {
    expect(podeCancelar({ dsStatus, dtHorario: futura }, agora)).toBe(true);
  });
  it.each(["LIBERADA", "REALIZADA", "FALTA"] as const)("%s não pode ser cancelada", (dsStatus) => {
    expect(podeCancelar({ dsStatus, dtHorario: futura }, agora)).toBe(false);
  });
  it("consulta que já passou não pode ser cancelada", () => {
    expect(podeCancelar({ dsStatus: "AGENDADA", dtHorario: "2026-11-11T09:59:00Z" }, agora)).toBe(false);
  });
});

describe("contato válido (cadastro de balcão sem telefone)", () => {
  const pessoa = (nrCelular: string, nrContatoRecado: string) => ({ nrCelular, nrContatoRecado });
  it("sem celular e sem recado não tem contato; só o recado já basta", () => {
    expect(temContatoValido(pessoa("", ""))).toBe(false);
    expect(temContatoValido(pessoa("  ", " "))).toBe(false);
    expect(temContatoValido(pessoa("", "(11) 96666-0000"))).toBe(true);
    expect(temContatoValido(pessoa("(11) 97777-0000", ""))).toBe(true);
  });
  it("depois do prazo, a consulta de quem não tem contato não é liberada", () => {
    const c = { cdConsulta: 1, cdHorario: 1, cdCidadao: 1, cdOrientacao: null, dtAgendamento: "2026-11-02T10:00:00Z", dtHorario: "2026-11-12T10:00:00Z",
      dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus: "AGENDADA" as const, vlProbFalta: .2, dsRiscoFalta: "BAIXO" as const, nmUnidade: "UBS" };
    const depois = new Date("2026-11-11T12:00:00Z");
    expect(deveLiberar(c, pessoa("", ""), depois)).toBe(false);
    expect(deveLiberar(c, pessoa("", "(11) 96666-0000"), depois)).toBe(true);
  });
});

describe("consulta e orientação do dia", () => {
  const dia = "2026-11-11";
  const c = (cdConsulta: number, cdCidadao: number, dtHorario: string, dsStatus: Consulta["dsStatus"] = "AGENDADA"): Consulta => ({
    cdConsulta, cdHorario: cdConsulta, cdCidadao, cdOrientacao: null, dtAgendamento: "2026-11-01T10:00:00", dtHorario,
    dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus, vlProbFalta: .2, dsRiscoFalta: "BAIXO", nmUnidade: "UBS",
  });
  it("consultaNoDia considera só agendada/confirmada da pessoa no dia, a mais cedo", () => {
    const consultas = [c(1, 7, "2026-11-11T15:00:00"), c(2, 7, "2026-11-11T09:00:00", "CONFIRMADA"), c(3, 7, "2026-11-11T08:00:00", "LIBERADA"),
      c(4, 7, "2026-11-11T07:00:00", "REALIZADA"), c(5, 7, "2026-11-12T08:00:00"), c(6, 8, "2026-11-11T08:00:00")];
    expect(consultaNoDia(consultas, 7, dia)?.cdConsulta).toBe(2);
    expect(consultaNoDia(consultas, 9, dia)).toBeUndefined();
    expect(consultaNoDia(consultas, null, dia)).toBeUndefined();
  });

  const o = (cdOrientacao: number, dtOrientacao: string, cdCidadao?: number | null): Orientacao => ({
    cdOrientacao, cdQueixa: 2, dsCor: "VERDE", dsDestino: "UBS", nrDor: 2, flElevadaModelo: false, dtOrientacao, ...(cdCidadao !== undefined ? { cdCidadao } : {}),
  });
  const e = (cdEntrada: number, cdCidadao: number | null, cdOrientacao: number, status: EntradaListaDoDia["status"] = "AGUARDANDO"): EntradaListaDoDia => ({
    cdEntrada, cdCidadao, cdOrientacao, cdUnidade: 1, nmCidadao: "P", dsCor: "VERDE", dtEntrada: "2026-11-11T08:00:00", flPrioridade: false, flCidadao: false, status,
  });
  it("orientacaoDoDia vale pela lista do dia (mesmo encerrada) ou pelo vínculo do Balcão", () => {
    expect(orientacaoDoDia([o(10, "2026-11-11T07:50:00")], [e(1, 7, 10, "ENCERRADA")], 7, dia)?.cdOrientacao).toBe(10);
    expect(orientacaoDoDia([o(11, "2026-11-11T08:30:00", 7)], [], 7, dia)?.cdOrientacao).toBe(11);
  });
  it("orientacaoDoDia ignora outro dia, outra pessoa e quem não tem cadastro, e escolhe a mais recente", () => {
    expect(orientacaoDoDia([o(10, "2026-11-10T07:50:00", 7)], [], 7, dia)).toBeUndefined();
    expect(orientacaoDoDia([o(10, "2026-11-11T07:50:00", 8)], [e(1, 8, 10)], 7, dia)).toBeUndefined();
    expect(orientacaoDoDia([o(10, "2026-11-11T07:50:00")], [e(1, null, 10)], null, dia)).toBeUndefined();
    expect(orientacaoDoDia([o(10, "2026-11-11T07:50:00"), o(11, "2026-11-11T10:00:00", 7)], [e(1, 7, 10)], 7, dia)?.cdOrientacao).toBe(11);
  });
  it("não encaixados não conta quem já tem consulta hoje", () => {
    const agora = new Date("2026-11-11T12:00:00");
    const lista = [e(1, 7, 10), e(2, 8, 11), e(3, null, 12)];
    expect(calcularIndicadores([c(1, 7, "2026-11-11T15:00:00")], lista, agora).naoEncaixadas).toBe(2);
    expect(calcularIndicadores([c(1, 7, "2026-11-12T15:00:00")], lista, agora).naoEncaixadas).toBe(3);
  });
});

describe("orientacoesDoDia", () => {
  it("lista as do dia da mais recente para a mais antiga; orientacaoDoDia é a primeira", () => {
    const o = (cdOrientacao: number, hora: string): Orientacao => ({ cdOrientacao, cdQueixa: 1, dsCor: "AZUL", dsDestino: "UBS", nrDor: 1, flElevadaModelo: false, dtOrientacao: `2026-11-11T${hora}:00`, cdCidadao: 7 });
    const lista = [o(1, "08:00"), o(2, "15:41"), o(3, "10:00")];
    expect(orientacoesDoDia(lista, [], 7, "2026-11-11").map((x) => x.cdOrientacao)).toEqual([2, 3, 1]);
    expect(orientacaoDoDia(lista, [], 7, "2026-11-11")?.cdOrientacao).toBe(2);
    expect(orientacoesDoDia(lista, [], null, "2026-11-11")).toEqual([]);
  });
});

describe("acoesPresenca (Agenda da recepção)", () => {
  const agora = new Date(2026, 10, 11, 10, 0);
  const em = (dia: number, hora: number, dsStatus: Consulta["dsStatus"] = "AGENDADA") => ({ dsStatus, dtHorario: new Date(2026, 10, dia, hora, 0).toISOString() });
  it("dia futuro: nenhum botão", () => expect(acoesPresenca(em(12, 9), agora)).toEqual({ presenca: false, falta: false }));
  it("no dia, antes do horário: só presença", () => expect(acoesPresenca(em(11, 15), agora)).toEqual({ presenca: true, falta: false }));
  it("no dia, depois do horário: os dois", () => expect(acoesPresenca(em(11, 8, "CONFIRMADA"), agora)).toEqual({ presenca: true, falta: true }));
  it("dia anterior: só falta", () => expect(acoesPresenca(em(10, 15), agora)).toEqual({ presenca: false, falta: true }));
  it.each(["REALIZADA", "FALTA", "LIBERADA"] as const)("%s: nenhum botão", (status) => {
    expect(acoesPresenca(em(11, 8, status), agora)).toEqual({ presenca: false, falta: false });
  });
});
