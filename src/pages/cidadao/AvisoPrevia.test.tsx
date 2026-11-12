import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { fichasIniciais } from "@/data/contaDemo";
import type { Cidadao } from "@/types";
import { Emergencia } from "./Emergencia";
import { FichaSaudePagina } from "./FichaSaude";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({ useSimulador: () => ({ estado }) }));

const SELO = "Prévia – integração com o Meu SUS prevista";

beforeEach(() => {
  estado = {
    dtSemente: "2026-11-11", unidades: [], orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [],
    horarios: [], consultas: [], cdUnidadeRecepcao: 1, cdCidadaoAtual: 1,
    cidadaos: [{ cdCidadao: 1, nmCidadao: "Maria da Silva", nmContatoRecado: "", nrContatoRecado: "" } as Cidadao],
    fichas: fichasIniciais(new Date()),
  };
});

describe("AvisoPrevia na ficha de saúde (prévia da US26)", () => {
  it("aparece na tela da ficha", () => {
    render(<FichaSaudePagina />);
    expect(screen.getByRole("note")).toHaveTextContent(SELO);
  });

  it("aparece dentro da seção Ficha de emergência", () => {
    render(<Emergencia />);
    const secao = screen.getByRole("region", { name: "Ficha de emergência" });
    expect(within(secao).getByText(SELO)).toBeInTheDocument();
  });
});
