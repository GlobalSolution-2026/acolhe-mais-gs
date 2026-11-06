import { describe, expect, it } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { EntradaListaDoDia, OfertaVaga } from "@/types";
import { escolherDestinatarioOferta, ofertasDoCidadao, segundosRestantesOferta, tempoRestanteOferta } from "./regrasAgendamento";
import { finalizarOferta, oferecerHorario, simularPrazo, vencerOfertas } from "./simulacao";

const agora = new Date("2026-11-05T10:00:00Z");
const H = 3_600_000;
const iso = (horas: number) => new Date(agora.getTime() + horas * H).toISOString();
const entrada = (id: number): EntradaListaDoDia => ({ cdEntrada: id, cdCidadao: id, cdUnidade: 1, nmCidadao: `Pessoa ${id}`, dsCor: "VERDE", dtEntrada: iso(-id), flPrioridade: id === 1, flCidadao: id === 3, status: "AGUARDANDO" });
const oferta = (id: number, status: OfertaVaga["status"] = "PENDENTE", cdHorario = 1): OfertaVaga => ({ cdOferta: id, cdHorario, cdUnidade: 1, cdEntrada: id, nmCidadao: `Pessoa ${id}`, status, dtCriacao: agora.toISOString() });
function estado(): EstadoSimulador {
  return { dtSemente: "2026-11-05", unidades: [], cdUnidadeRecepcao: 1, cdCidadaoAtual: null, orientacoes: [], orientacaoAtual: null, ofertas: [], listaDoDia: [entrada(1), entrada(2), entrada(3)],
    cidadaos: [1, 2, 3, 4].map((id) => ({ cdCidadao: id, nmCidadao: `Pessoa ${id}`, nrCns: String(id), dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: id === 4 ? "" : "11999999999", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" })),
    horarios: [1, 2, 3, 4].map((id) => ({ cdHorario: id, cdUnidade: id === 3 ? 2 : 1, dtHorario: iso(id === 3 ? 120 : 48), nrDuracaoMin: 20, flOcupado: true })),
    consultas: [1, 2, 3, 4].map((id) => ({ cdConsulta: id, cdHorario: id, cdCidadao: id, cdOrientacao: null, dtAgendamento: iso(-72), dtHorario: iso(id === 3 ? 120 : 48), dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus: "AGENDADA", dsRiscoFalta: "BAIXO", vlProbFalta: .2, nmUnidade: "UBS" })) };
}

describe("destinatário das ofertas", () => {
  it("não oferece a quem perdeu", () => expect(escolherDestinatarioOferta([entrada(1), entrada(2)], [], 1, 1)?.cdCidadao).toBe(2));
  it("pula quem tem oferta pendente em outra vaga", () => expect(escolherDestinatarioOferta([entrada(1), entrada(2)], [oferta(1, "PENDENTE", 2)], 1, null)?.cdCidadao).toBe(2));
  it.each(["RECUSADA", "EXPIRADA"] as const)("não repete quem deixou %s esta vaga", (status) => {
    expect(escolherDestinatarioOferta([entrada(1), entrada(2)], [oferta(1, status)], 1, null)?.cdCidadao).toBe(2);
    expect(escolherDestinatarioOferta([entrada(1), entrada(2)], [oferta(1, status)], 2, null)?.cdCidadao).toBe(1);
  });
  it.each(["RECUSADA", "EXPIRADA"] as const)("repasse após %s", (status) => {
    const e = estado(); e.horarios[0] = { ...e.horarios[0], cdHorario: 1, cdUnidade: 1, dtHorario: iso(48), nrDuracaoMin: 20, flOcupado: false };
    const oferecido = oferecerHorario(e, 1, agora);
    const proximo = finalizarOferta(oferecido, 1, status, agora);
    expect(proximo.ofertas).toHaveLength(2);
    expect(proximo.ofertas[1]).toMatchObject({ cdHorario: 1, cdEntrada: 3, status: "PENDENTE" });
  });
  it("exibe e conta apenas as ofertas do próprio cidadão", () => expect(ofertasDoCidadao([oferta(1), oferta(2), oferta(3)], [entrada(1), entrada(2), entrada(3)]).map((o) => o.cdEntrada)).toEqual([3]));
  it("30 minutos duram 300 segundos reais e contador usa tempo simulado", () => {
    expect(segundosRestantesOferta(oferta(1), agora)).toBe(300);
    expect(tempoRestanteOferta(oferta(1), new Date(agora.getTime() + 30_000))).toBe("27:00");
    expect(tempoRestanteOferta(oferta(1), new Date(agora.getTime() + 23_334))).toBe("27:40");
    expect(tempoRestanteOferta(oferta(1), new Date(agora.getTime() - 1000))).toBe("30:00");
    expect(segundosRestantesOferta(oferta(1), new Date(agora.getTime() + 300_000))).toBe(0);
  });
  it("vencimento global repassa sem expirar a oferta recém-criada", () => {
    const e = estado(); e.horarios = e.horarios.map((h) => ({ ...h, flOcupado: false })); e.ofertas = [oferta(1)];
    const novo = vencerOfertas(e, new Date(agora.getTime() + 300_000));
    expect(novo.ofertas.map((o) => o.status)).toEqual(["EXPIRADA", "PENDENTE"]);
  });
  it("respeita exatamente 60 minutos de antecedência", () => {
    const e = estado(); e.horarios = [{ cdHorario: 1, cdUnidade: 1, dtHorario: iso(1), nrDuracaoMin: 20, flOcupado: false }];
    expect(oferecerHorario(e, 1, agora).ofertas).toHaveLength(1);
    e.horarios = e.horarios.map((h) => ({ ...h, dtHorario: iso(.99) }));
    expect(oferecerHorario(e, 1, agora).ofertas).toHaveLength(0);
  });
});

describe("simulação do prazo", () => {
  it("somente UBS selecionada por 3 dias; preserva sem contato e pula pendentes", () => {
    const e = estado(); const original = structuredClone(e);
    const { novoEstado, resumo } = simularPrazo(e, agora);
    expect(resumo).toEqual({ consultasLiberadas: 2, vagasOferecidas: 2, vagasDeVoltaNaAgenda: 0, mantidasSemContato: 1 });
    expect(novoEstado.consultas.map((c) => c.dsStatus)).toEqual(["LIBERADA", "LIBERADA", "AGENDADA", "AGENDADA"]);
    expect(new Set(novoEstado.ofertas.map((o) => o.cdEntrada)).size).toBe(2);
    expect(e).toEqual(original);
  });
  it("inclui cidadão atual em outra UBS e qualquer data", () => {
    const e = estado(); e.cdCidadaoAtual = 3;
    expect(simularPrazo(e, agora).novoEstado.consultas[2]?.dsStatus).toBe("LIBERADA");
  });
  it("vaga sem elegível retorna à agenda", () => {
    const e = estado(); e.listaDoDia = [];
    expect(simularPrazo(e, agora).resumo).toMatchObject({ vagasOferecidas: 0, vagasDeVoltaNaAgenda: 2 });
  });
  it("confirmada e marcada com menos de 1 dia útil de antecedência são mantidas", () => {
    const e = estado(); e.consultas = e.consultas.map((c, i) => i === 0 ? { ...c, dsStatus: "CONFIRMADA" } : { ...c, dtAgendamento: iso(47) });
    expect(simularPrazo(e, agora).resumo.consultasLiberadas).toBe(0);
  });
  it("sem consultas retorna resumo vazio", () => {
    const e = estado(); e.consultas = [];
    expect(simularPrazo(e, agora).resumo).toEqual({ consultasLiberadas: 0, vagasOferecidas: 0, vagasDeVoltaNaAgenda: 0, mantidasSemContato: 0 });
  });
});

it("simulação conta três dias com horários, atravessando fim de semana", () => {
  const e = estado();
  const agora = new Date("2026-11-06T10:00:00");
  const datas = ["2026-11-06T14:00:00", "2026-11-09T09:00:00", "2026-11-10T16:00:00", "2026-11-11T08:00:00"];
  e.horarios = e.horarios.map((h, i) => ({ ...h, cdUnidade: 1, dtHorario: datas[i] ?? "" }));
  e.consultas = e.consultas.map((c, i) => ({ ...c, cdCidadao: 1, dtHorario: datas[i] ?? "", dtAgendamento: "2026-10-30T08:00:00" }));
  expect(simularPrazo(e, agora).novoEstado.consultas.map((c) => c.dsStatus)).toEqual(["LIBERADA", "LIBERADA", "LIBERADA", "AGENDADA"]);
});
