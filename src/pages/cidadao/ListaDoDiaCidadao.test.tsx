import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { ListaDoDiaCidadao } from "./ListaDoDiaCidadao";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search }: { children: ReactNode; to: string; search?: Record<string, unknown> }) => (
    <a href={to} data-search={JSON.stringify(search ?? {})}>{children}</a>
  ),
}));

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado }),
}));

beforeEach(() => {
  estado = {
    dtSemente: "2026-11-11", horarios: [], cidadaos: [], consultas: [], cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null, ofertas: [],
    unidades: [{ cdUnidade: 2, nmUnidade: "UBS Centro", tpUnidade: "UBS", dsEndereco: "", nrCep: "01000-000", nrTelefone: "" }],
    listaDoDia: [{ cdEntrada: 1, cdCidadao: null, cdOrientacao: 5, cdUnidade: 2, nmCidadao: "Você", dsCor: "VERDE", dtEntrada: new Date().toISOString(), flPrioridade: false, flCidadao: true, status: "AGUARDANDO" }],
    cdCidadaoAtual: null,
  };
});

describe("Lista do dia: entrar para receber a vaga", () => {
  it("sem login, oferece Entrar e Criar conta voltando para a lista do dia", () => {
    render(<ListaDoDiaCidadao />);
    expect(screen.getByText("Sua posição na fila da UBS Centro")).toBeInTheDocument();
    const destino = JSON.stringify({ horario: 0, oferta: 0, destino: "lista-do-dia" });
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/cidadao/entrar");
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("data-search", destino);
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/cidadao/criar-conta");
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("data-search", destino);
  });

  it("com login, não mostra o convite", () => {
    estado.cdCidadaoAtual = 1;
    render(<ListaDoDiaCidadao />);
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  });
});
