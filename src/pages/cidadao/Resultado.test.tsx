import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import type { Cor } from "@/types/orientacao";
import { Resultado } from "./Resultado";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado, definirResultado: vi.fn() }),
}));

function preparar(dsCor: Cor, nrCep = "04012-000") {
  estado = {
    dtSemente: "2026-11-11",
    unidades: [
      { cdUnidade: 1, nmUnidade: "UBS Longe", tpUnidade: "UBS", dsEndereco: "Rua A, 1", nrCep: "09000-000", nrTelefone: "(11) 3333-0001" },
      { cdUnidade: 2, nmUnidade: "UBS Perto", tpUnidade: "UBS", dsEndereco: "Rua B, 2", nrCep: "04010-100", nrTelefone: "(11) 3333-0002" },
      { cdUnidade: 3, nmUnidade: "UPA Centro", tpUnidade: "UPA", dsEndereco: "Rua C, 3", nrCep: "04011-000", nrTelefone: "(11) 3333-0003" },
    ],
    horarios: [], cidadaos: [], consultas: [], cdUnidadeRecepcao: 1, orientacoes: [], listaDoDia: [], ofertas: [],
    cdCidadaoAtual: null,
    orientacaoAtual: {
      cdQueixa: "GARGANTA", nrCep, respostas: {}, ordem: [],
      resultado: { cdOrientacao: 37, dsCor, dsDestino: dsCor === "AMARELO" ? "UPA" : "UBS", sinaisMarcados: [], nrDor: 2, flElevadaModelo: false },
    },
  };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
}

describe("Resultado: Prefiro ir à UBS", () => {
  beforeEach(() => preparar("VERDE"));

  it.each(["VERDE", "AZUL"] as const)("%s mostra o código e a UBS indicada, sem login", async (cor) => {
    preparar(cor);
    render(<Resultado />);
    expect(screen.queryByLabelText("Código 37")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Prefiro ir à UBS" }));
    expect(screen.getByLabelText("Código 37")).toBeInTheDocument();
    expect(screen.getByText("O código vale só para hoje. Leve o Cartão SUS.")).toBeInTheDocument();
    expect(await screen.findByText("UBS indicada: UBS Perto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Prefiro ir à UBS" })).not.toBeInTheDocument();
  });

  it("AMARELO não oferece ir à UBS", () => {
    preparar("AMARELO");
    render(<Resultado />);
    expect(screen.queryByRole("button", { name: "Prefiro ir à UBS" })).not.toBeInTheDocument();
  });
});

describe("Resultado LARANJA", () => {
  it("indica pronto-socorro do SUS com link para o Busca Saúde e mantém o 192", () => {
    preparar("LARANJA");
    render(<Resultado />);
    expect(screen.getByRole("heading", { name: "Vá ao pronto-socorro de um hospital público ou que atenda pelo SUS" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Ver prontos-socorros no Busca Saúde/ });
    expect(link).toHaveAttribute("href", "https://buscasaude.prefeitura.sp.gov.br/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/Se não tiver como chegar com segurança/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ligar para o 192/ })).toHaveAttribute("href", "tel:192");
  });
});

describe("Resultado sem CEP (CEP opcional no Início)", () => {
  it("AMARELO mostra a orientação e pede o CEP em vez de indicar uma UPA", () => {
    preparar("AMARELO", "");
    render(<Resultado />);
    expect(screen.getByText("Procure a UPA mais perto de você.")).toBeInTheDocument();
    expect(screen.getByText("Informe seu CEP para ver a UPA mais próxima.")).toBeInTheDocument();
    expect(screen.queryByText("UPA Centro")).not.toBeInTheDocument();
  });

  it("AMARELO com CEP indica a UPA e não pede o CEP", async () => {
    preparar("AMARELO");
    render(<Resultado />);
    expect(await screen.findByText("UPA Centro")).toBeInTheDocument();
    expect(screen.queryByText("Informe seu CEP para ver a UPA mais próxima.")).not.toBeInTheDocument();
  });

  it("VERDE: Prefiro ir à UBS mostra o código e pede o CEP, sem UBS indicada", () => {
    preparar("VERDE", "");
    render(<Resultado />);
    fireEvent.click(screen.getByRole("button", { name: "Prefiro ir à UBS" }));
    expect(screen.getByLabelText("Código 37")).toBeInTheDocument();
    expect(screen.getByText("Informe seu CEP para ver a UBS indicada.")).toBeInTheDocument();
    expect(screen.queryByText(/UBS indicada:/)).not.toBeInTheDocument();
  });
});
