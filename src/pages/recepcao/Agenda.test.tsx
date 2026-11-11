import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { Agenda } from "./Agenda";

const hojeAs = (h: number, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado }),
}));

describe("Agenda: lembrete de orientação do dia", () => {
  it("mostra a orientação mais recente do dia no card da consulta de hoje", () => {
    estado = {
      dtSemente: "2026-11-11", ofertas: [], cdUnidadeRecepcao: 1, orientacaoAtual: null, cdCidadaoAtual: null,
      unidades: [{ cdUnidade: 1, nmUnidade: "UBS Centro", tpUnidade: "UBS", dsEndereco: "", nrCep: "04010-100", nrTelefone: "" }],
      cidadaos: [{ cdCidadao: 7, nmCidadao: "Rosa Lima", nrCns: "1", dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" }],
      horarios: [{ cdHorario: 1, cdUnidade: 1, dtHorario: hojeAs(23, 30), nrDuracaoMin: 20, flOcupado: true }],
      consultas: [{ cdConsulta: 1, cdHorario: 1, cdCidadao: 7, cdOrientacao: null, dtAgendamento: hojeAs(7), dtConfirmacao: null, dsCanalConfirmacao: null,
        dsStatus: "AGENDADA", vlProbFalta: .2, dsRiscoFalta: "BAIXO", nmUnidade: "UBS Centro", dtHorario: hojeAs(23, 30) }],
      orientacoes: [
        { cdOrientacao: 10, cdQueixa: 2, dsCor: "AZUL", dsDestino: "UBS", nrDor: 2, flElevadaModelo: false, dtOrientacao: hojeAs(0, 10) },
        { cdOrientacao: 12, cdQueixa: 3, dsCor: "VERDE", dsDestino: "UBS", nrDor: 3, flElevadaModelo: false, dtOrientacao: hojeAs(0, 20), cdCidadao: 7 },
      ],
      listaDoDia: [{ cdEntrada: 1, cdCidadao: 7, cdOrientacao: 10, cdUnidade: 1, nmCidadao: "Rosa Lima", dsCor: "AZUL", dtEntrada: hojeAs(0, 15), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" }],
    };
    render(<Agenda />);
    expect(screen.getByText("Rosa Lima")).toBeInTheDocument();
    expect(screen.getByText("Fez orientação hoje: Diarreia e vômito, verde")).toBeInTheDocument();
  });
});
