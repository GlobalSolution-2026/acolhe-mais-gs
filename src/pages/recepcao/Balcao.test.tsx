import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import type { Consulta } from "@/types";
import type { Cor, Orientacao } from "@/types/orientacao";
import { Balcao } from "./Balcao";

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado, obterEstado: () => estado }),
}));

const hoje = new Date();
const ontem = new Date(hoje.getTime() - 86_400_000);
const orientacao = (cdOrientacao: number, dsCor: Cor, dt = hoje): Orientacao => ({
  cdOrientacao, cdQueixa: 2, dsCor, dsDestino: dsCor === "AMARELO" ? "UPA" : "UBS", nrDor: 2, flElevadaModelo: false, dtOrientacao: dt.toISOString(),
});
const consultaCom = (cdOrientacao: number): Consulta => ({
  cdConsulta: 1, cdHorario: 1, cdCidadao: 1, cdOrientacao, dtAgendamento: hoje.toISOString(), dtConfirmacao: null, dsCanalConfirmacao: null,
  dsStatus: "AGENDADA", vlProbFalta: .1, dsRiscoFalta: "BAIXO", nmUnidade: "UBS Centro", dtHorario: hoje.toISOString(),
});

beforeEach(() => {
  estado = {
    dtSemente: "2026-11-11",
    unidades: [
      { cdUnidade: 1, nmUnidade: "UBS Centro", tpUnidade: "UBS", dsEndereco: "Rua A, 1", nrCep: "04010-100", nrTelefone: "(11) 3333-0001" },
      { cdUnidade: 9, nmUnidade: "UPA Vila", tpUnidade: "UPA", dsEndereco: "Rua U, 9", nrCep: "04020-000", nrTelefone: "(11) 3333-0009" },
    ],
    horarios: [], cidadaos: [], consultas: [], cdUnidadeRecepcao: 1, listaDoDia: [], ofertas: [],
    orientacoes: [orientacao(10, "VERDE", ontem), orientacao(11, "AMARELO"), orientacao(12, "VERDE"), orientacao(13, "AZUL")],
    orientacaoAtual: null, cdCidadaoAtual: null,
  };
  estado.consultas = [consultaCom(13)];
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});

const botao = (nome: string) => screen.getByRole("button", { name: nome });
const ESPERA = { timeout: 3000 };

function digitarCodigo(codigo: string) {
  render(<Balcao />);
  fireEvent.click(botao("Tem código"));
  fireEvent.change(screen.getByLabelText("Código da orientação"), { target: { value: codigo } });
  fireEvent.click(botao("Buscar código"));
}

describe("Balcão: tem código", () => {
  it("código inexistente mostra erro", async () => {
    digitarCodigo("99");
    expect(await screen.findByText(/Código não encontrado/, {}, ESPERA)).toBeInTheDocument();
  });

  it("código de outro dia está vencido e oferece fazer a orientação aqui", async () => {
    digitarCodigo("10");
    expect(await screen.findByText("Orientação vencida", {}, ESPERA)).toBeInTheDocument();
    fireEvent.click(botao("Fazer a orientação aqui"));
    expect(screen.getByText("Qual a queixa principal?")).toBeInTheDocument();
  });

  it("código com consulta já foi utilizado", async () => {
    digitarCodigo("13");
    expect(await screen.findByText("Código já utilizado.", {}, ESPERA)).toBeInTheDocument();
    expect(screen.queryByText("Orientação pronta para o agendamento.")).not.toBeInTheDocument();
  });

  it("AMARELO mostra queixa, cor, a UPA e não segue para o agendamento", async () => {
    digitarCodigo("11");
    expect(await screen.findByText("Encaminhe para a UPA", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByText("Amarelo – UPA")).toBeInTheDocument();
    expect(screen.getByText("Dor de garganta")).toBeInTheDocument();
    expect(await screen.findByText("UPA Vila", {}, ESPERA)).toBeInTheDocument();
    expect(screen.queryByText("Orientação pronta para o agendamento.")).not.toBeInTheDocument();
  });

  it("VERDE de hoje segue para o agendamento", async () => {
    digitarCodigo("12");
    expect(await screen.findByText("Orientação pronta para o agendamento.", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByText("Verde – UBS")).toBeInTheDocument();
    expect(screen.getByText("Dor de garganta")).toBeInTheDocument();
  });
});

describe("Balcão: orientação feita aqui", () => {
  async function inicioGarganta(idade: string) {
    render(<Balcao />);
    fireEvent.click(botao("Fazer a orientação aqui"));
    fireEvent.click(botao("Dor de garganta"));
    fireEvent.click(botao("Para mim"));
    fireEvent.change(screen.getByLabelText("Idade em anos"), { target: { value: idade } });
    fireEvent.click(botao("Continuar"));
  }

  it("menor de idade para sem agendar, com a indicação do SAMU", async () => {
    await inicioGarganta("15");
    expect(await screen.findByText("A orientação do Acolhe+ é só para adultos. Encaminhe para o acolhimento da UBS.", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ligar para o 192/ })).toHaveAttribute("href", "tel:192");
    expect(estado.orientacaoAtual).toBeNull();
    expect(estado.orientacoes).toHaveLength(4);
  });

  it("alarme vermelho orienta o SAMU, salva a orientação sem cidadão e não usa a orientação do app", async () => {
    await inicioGarganta("30");
    fireEvent.click(await screen.findByRole("button", { name: "Masculino" }, ESPERA));
    fireEvent.click(botao("2"));
    fireEvent.click(botao("Não"));
    fireEvent.click(botao("Sim"));
    expect(await screen.findByText("Acione o SAMU 192 agora", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByText("Dificuldade para respirar")).toBeInTheDocument();
    const salva = estado.orientacoes.at(-1);
    expect(salva).toMatchObject({ cdOrientacao: 14, dsCor: "VERMELHO", dsDestino: "SAMU" });
    expect(salva?.cdCidadao ?? null).toBeNull();
    expect(estado.orientacaoAtual).toBeNull();
  });
});
