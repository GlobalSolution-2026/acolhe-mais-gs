import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import type { Cidadao, Consulta, Horario } from "@/types";
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
    expect(screen.queryByText("Identificar o cidadão")).not.toBeInTheDocument();
  });

  it("AMARELO mostra queixa, cor, a UPA e não segue para o agendamento", async () => {
    digitarCodigo("11");
    expect(await screen.findByText("Encaminhe para a UPA", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByText("Amarelo – UPA")).toBeInTheDocument();
    expect(screen.getByText("Dor de garganta")).toBeInTheDocument();
    expect(await screen.findByText("UPA Vila", {}, ESPERA)).toBeInTheDocument();
    expect(screen.queryByText("Identificar o cidadão")).not.toBeInTheDocument();
  });

  it("VERDE de hoje segue para o agendamento", async () => {
    digitarCodigo("12");
    expect(await screen.findByText("Identificar o cidadão", {}, ESPERA)).toBeInTheDocument();
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

describe("Balcão: identificação e agendamento", () => {
  const maria: Cidadao = { cdCidadao: 1, nmCidadao: "Maria Silva", nrCns: "111222233334444", dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" };
  const horario = (cdHorario: number, horas: number, flOcupado = false): Horario => ({
    cdHorario, cdUnidade: 1, dtHorario: new Date(Date.now() + horas * 3_600_000).toISOString(), nrDuracaoMin: 20, flOcupado,
  });

  async function codigoVerde() {
    digitarCodigo("12");
    await screen.findByText("Identificar o cidadão", {}, ESPERA);
  }
  async function buscarCns(cns: string) {
    fireEvent.change(screen.getByLabelText("Cartão SUS do cidadão (15 números)"), { target: { value: cns } });
    fireEvent.click(botao("Buscar cadastro"));
  }
  function preencherCadastro() {
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "José Novo" } });
    fireEvent.change(screen.getByLabelText("Celular com DDD"), { target: { value: "(11) 97777-0000" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1970-05-05" } });
    fireEvent.change(screen.getByLabelText("Sexo"), { target: { value: "M" } });
    fireEvent.change(screen.getByLabelText("Contato de recado (opcional)"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Telefone do contato de recado (opcional)"), { target: { value: "(11) 96666-0000" } });
  }

  it("sem cadastro: cadastro de balcão sem senha, vincula e agenda no horário livre mais próximo", async () => {
    estado.cidadaos = [maria];
    estado.credenciais = [];
    estado.horarios = [horario(1, 72), horario(2, 3), horario(3, 2, true), horario(4, -1)];
    await codigoVerde();
    await buscarCns("999888777666555");
    expect(await screen.findByText("Cadastro de balcão", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByLabelText("Cartão SUS (15 números)")).toHaveValue("999888777666555");
    preencherCadastro();
    fireEvent.click(botao("Cadastrar"));
    expect(await screen.findByText(/vinculada a José Novo/, {}, ESPERA)).toBeInTheDocument();
    const novo = estado.cidadaos.find((c) => c.nrCns === "999888777666555");
    expect(novo).toMatchObject({ nmCidadao: "José Novo", nrContatoRecado: "(11) 96666-0000", nrCep: "04010-100" });
    expect(estado.credenciais).toEqual([]);
    expect(estado.orientacoes.find((o) => o.cdOrientacao === 12)?.cdCidadao).toBe(novo?.cdCidadao);
    expect(screen.getByLabelText("Horário livre (sugerido: o mais próximo)")).toHaveValue("2");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.click(botao("Agendar"));
    expect(await screen.findByText("Consulta agendada", {}, ESPERA)).toBeInTheDocument();
    expect(estado.consultas.at(-1)).toMatchObject({ cdHorario: 2, cdCidadao: novo?.cdCidadao, cdOrientacao: 12, dsStatus: "AGENDADA" });
    expect(estado.horarios.find((h) => h.cdHorario === 2)?.flOcupado).toBe(true);
  });

  it("cadastro de balcão sem telefone: 'Não tem telefone' dispensa o celular e avisa que não há contato", async () => {
    estado.cidadaos = [maria];
    estado.horarios = [horario(2, 3)];
    await codigoVerde();
    await buscarCns("999888777666555");
    await screen.findByText("Cadastro de balcão", {}, ESPERA);
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Sem Fone" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1950-01-01" } });
    fireEvent.change(screen.getByLabelText("Sexo"), { target: { value: "F" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Não tem telefone" }));
    expect(screen.queryByLabelText("Celular com DDD")).not.toBeInTheDocument();
    expect(screen.getByText(/Sem telefone e sem contato de recado/)).toBeInTheDocument();
    fireEvent.click(botao("Cadastrar"));
    expect(await screen.findByText(/vinculada a Sem Fone/, {}, ESPERA)).toBeInTheDocument();
    expect(estado.cidadaos.find((c) => c.nmCidadao === "Sem Fone")).toMatchObject({ nrCelular: "", nrContatoRecado: "" });
    fireEvent.click(botao("Agendar"));
    expect(await screen.findByText("Consulta agendada", {}, ESPERA)).toBeInTheDocument();
  });

  it("mesmo cidadão já vinculado e sem horário livre: confere o cadastro e entra na lista do dia com a cor", async () => {
    estado.cidadaos = [maria];
    estado.orientacoes = estado.orientacoes.map((o) => (o.cdOrientacao === 12 ? { ...o, cdCidadao: 1 } : o));
    estado.horarios = [horario(3, 2, true)];
    await codigoVerde();
    await buscarCns("1112 2223 3334 444");
    expect(await screen.findByText("Conferir cadastro", {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByLabelText("Celular com DDD")).toHaveValue("(11) 98888-0001");
    fireEvent.click(botao("Confirmar dados"));
    fireEvent.click(await screen.findByRole("button", { name: /Colocar na lista do dia \(Verde\)/ }, ESPERA));
    expect(await screen.findByText("Na lista do dia", {}, ESPERA)).toBeInTheDocument();
    expect(estado.listaDoDia).toEqual([expect.objectContaining({ cdCidadao: 1, cdOrientacao: 12, cdUnidade: 1, dsCor: "VERDE", flCidadao: false, status: "AGUARDANDO" })]);
    expect(screen.getByText(/1º da fila \(Verde\)/)).toBeInTheDocument();
  });

  it.each([["outro cidadão cadastrado", "111222233334444"], ["CNS novo", "999888777666555"]])(
    "orientação vinculada a outra pessoa bloqueia (%s)", async (_caso, cns) => {
      estado.cidadaos = [maria];
      estado.orientacoes = estado.orientacoes.map((o) => (o.cdOrientacao === 12 ? { ...o, cdCidadao: 50 } : o));
      await codigoVerde();
      await buscarCns(cns);
      expect(await screen.findByText("Código já utilizado.", {}, ESPERA)).toBeInTheDocument();
      expect(screen.queryByLabelText("Nome completo")).not.toBeInTheDocument();
    });
});
