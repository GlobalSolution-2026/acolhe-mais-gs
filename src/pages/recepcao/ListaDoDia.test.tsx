import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { Consulta } from "@/types";
import { ListaDoDia } from "./ListaDoDia";

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado, oferecerVaga: vi.fn(), responderOferta: vi.fn() }),
}));

const hojeAs = (h: number, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const consulta = (cdCidadao: number, dtHorario: string): Consulta => ({
  cdConsulta: cdCidadao, cdHorario: 100 + cdCidadao, cdCidadao, cdOrientacao: null, dtAgendamento: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus: "AGENDADA", vlProbFalta: .2, dsRiscoFalta: "BAIXO", nmUnidade: "UBS Centro", dtHorario,
});

beforeEach(() => {
  estado = {
    dtSemente: "2026-11-11", unidades: [], horarios: [], ofertas: [], cdUnidadeRecepcao: 1, orientacaoAtual: null, cdCidadaoAtual: null,
    cidadaos: [],
    orientacoes: [
      { cdOrientacao: 10, cdQueixa: 2, dsCor: "VERDE", dsDestino: "UBS", nrDor: 2, flElevadaModelo: false, dtOrientacao: hojeAs(7, 30) },
      { cdOrientacao: 11, cdQueixa: 1, dsCor: "AZUL", dsDestino: "UBS", nrDor: 1, flElevadaModelo: false, dtOrientacao: hojeAs(7, 40) },
    ],
    listaDoDia: [
      { cdEntrada: 1, cdCidadao: 7, cdOrientacao: 10, cdUnidade: 1, nmCidadao: "Rosa Lima", dsCor: "VERDE", dtEntrada: hojeAs(7, 35), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
      { cdEntrada: 2, cdCidadao: 8, cdOrientacao: 11, cdUnidade: 1, nmCidadao: "Paulo Reis", dsCor: "AZUL", dtEntrada: hojeAs(7, 45), flPrioridade: false, flCidadao: false, status: "AGUARDANDO" },
    ],
    consultas: [consulta(7, hojeAs(15, 0))],
  };
});

describe("Lista do dia (recepção): quem já tem consulta hoje", () => {
  it("mostra o selo da orientação de hoje e o horário da consulta só para essa pessoa", () => {
    render(<ListaDoDia />);
    expect(screen.getAllByText(/Fez orientação hoje/)).toHaveLength(1);
    expect(screen.getByText("Fez orientação hoje: Dor de garganta, verde")).toBeInTheDocument();
    expect(screen.queryByText(/Outra orientação hoje/)).not.toBeInTheDocument();
    expect(screen.getByText("Consulta hoje às 15:00: não recebe oferta de vaga de hoje.")).toBeInTheDocument();
  });
});

describe("Lista do dia (recepção): selo da entrada da fila", () => {
  it("mostra a orientação da fila e, abaixo, a outra orientação do dia com o horário", () => {
    estado.orientacoes.push({ cdOrientacao: 12, cdQueixa: 3, dsCor: "VERDE", dsDestino: "UBS", nrDor: 3, flElevadaModelo: false, dtOrientacao: hojeAs(15, 41), cdCidadao: 7 });
    render(<ListaDoDia />);
    expect(screen.getByText("Fez orientação hoje: Dor de garganta, verde")).toBeInTheDocument();
    expect(screen.getByText("Outra orientação hoje: Diarreia e vômito, verde, 15:41")).toBeInTheDocument();
  });

  it("na fila com prioridade de ontem, o selo mostra a data da orientação da fila", () => {
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1); ontem.setHours(9, 0, 0, 0);
    estado.orientacoes = estado.orientacoes.map((o) => (o.cdOrientacao === 10 ? { ...o, dtOrientacao: ontem.toISOString() } : o));
    estado.listaDoDia = estado.listaDoDia.map((e) => (e.cdEntrada === 1 ? { ...e, flPrioridade: true } : e));
    render(<ListaDoDia />);
    const dia = ontem.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
    expect(screen.getByText(`Orientação da fila (${dia}): Dor de garganta, verde`)).toBeInTheDocument();
    expect(screen.queryByText(/Fez orientação hoje/)).not.toBeInTheDocument();
  });
});
