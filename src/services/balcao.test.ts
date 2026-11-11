import { describe, expect, it } from "vitest";
import type { Consulta, Horario, OfertaVaga } from "@/types";
import type { Cor, Orientacao } from "@/types/orientacao";
import { avaliarCodigo, horariosLivresBalcao, podeVincular } from "./balcao";

const agora = new Date(2026, 10, 11, 8, 0);
const ontem = new Date(2026, 10, 10, 23, 50);
const orientacao = (cdOrientacao: number, dsCor: Cor = "VERDE", dt: Date = new Date(2026, 10, 11, 7, 30)): Orientacao => ({
  cdOrientacao, cdQueixa: 1, dsCor, dsDestino: dsCor === "VERDE" || dsCor === "AZUL" ? "UBS" : "UPA", nrDor: 2, flElevadaModelo: false, dtOrientacao: dt.toISOString(),
});
const consulta = (cdOrientacao: number | null): Consulta => ({
  cdConsulta: 1, cdHorario: 1, cdCidadao: 1, cdOrientacao, dtAgendamento: agora.toISOString(), dtConfirmacao: null, dsCanalConfirmacao: null,
  dsStatus: "AGENDADA", vlProbFalta: .1, dsRiscoFalta: "BAIXO", nmUnidade: "UBS", dtHorario: agora.toISOString(),
});

describe("avaliarCodigo", () => {
  it("código inexistente", () => {
    expect(avaliarCodigo(99, [orientacao(1)], [], agora)).toEqual({ tipo: "INEXISTENTE" });
  });
  it("só vale no mesmo dia da orientação", () => {
    expect(avaliarCodigo(1, [orientacao(1, "VERDE", ontem)], [], agora).tipo).toBe("VENCIDA");
  });
  it("código com consulta já foi utilizado", () => {
    expect(avaliarCodigo(1, [orientacao(1)], [consulta(1)], agora).tipo).toBe("JA_UTILIZADA");
    expect(avaliarCodigo(1, [orientacao(1)], [consulta(null), consulta(2)], agora).tipo).toBe("OK");
  });
  it.each(["AMARELO", "LARANJA", "VERMELHO"] as const)("%s encaminha para o destino indicado", (cor) => {
    expect(avaliarCodigo(1, [orientacao(1, cor)], [], agora)).toMatchObject({ tipo: "ENCAMINHAR", orientacao: { dsCor: cor } });
  });
  it.each(["VERDE", "AZUL"] as const)("%s segue para o agendamento", (cor) => {
    expect(avaliarCodigo(1, [orientacao(1, cor)], [], agora)).toMatchObject({ tipo: "OK", orientacao: { cdOrientacao: 1 } });
  });
});

describe("podeVincular", () => {
  it("sem dono ou mesmo cidadão pode; outro cidadão não", () => {
    expect(podeVincular({}, 5)).toBe(true);
    expect(podeVincular({ cdCidadao: null }, 5)).toBe(true);
    expect(podeVincular({ cdCidadao: 5 }, 5)).toBe(true);
    expect(podeVincular({ cdCidadao: 6 }, 5)).toBe(false);
  });
});

describe("horariosLivresBalcao", () => {
  const h = (cdHorario: number, horas: number, extra: Partial<Horario> = {}): Horario => ({
    cdHorario, cdUnidade: 1, dtHorario: new Date(agora.getTime() + horas * 3_600_000).toISOString(), nrDuracaoMin: 20, flOcupado: false, ...extra,
  });
  const oferta = (cdHorario: number, status: OfertaVaga["status"]): OfertaVaga => ({
    cdOferta: cdHorario, cdHorario, cdUnidade: 1, cdEntrada: 1, nmCidadao: "A", dtCriacao: agora.toISOString(), status,
  });
  it("só futuros, livres, da UBS e sem oferta pendente, do mais próximo ao mais distante", () => {
    const horarios = [h(1, 48), h(2, 2), h(3, -1), h(4, 3, { flOcupado: true }), h(5, 1, { cdUnidade: 2 }), h(6, 4), h(7, 5)];
    const livres = horariosLivresBalcao(horarios, [oferta(6, "PENDENTE"), oferta(7, "RECUSADA")], 1, agora);
    expect(livres.map((x) => x.cdHorario)).toEqual([2, 7, 1]);
  });
});
