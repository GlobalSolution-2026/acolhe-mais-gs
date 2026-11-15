import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVISO_IDENTIFICACAO } from "@/components/FormularioCidadao";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { Cidadao, CidadaoEntrada } from "@/types";
import { Agendar } from "./Agendar";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  Navigate: () => null,
  useNavigate: () => navigate,
}));

const cadastro: Cidadao = { cdCidadao: 5, nmCidadao: "Ana Beatriz", nrCns: "090000000000005", dtNascimento: "2001-05-14", dsSexo: "F", nrCelular: "(11) 98888-0005", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" };
let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado, definirCidadaoAtual: vi.fn(), responderOferta: vi.fn() }),
}));
const atualizarCidadao = vi.fn(async (cdCidadao: number, dados: CidadaoEntrada, _opcoes?: { manterIdentificacao?: boolean }) => ({ ...dados, cdCidadao }));
vi.mock("@/services/api", () => ({
  atualizarCidadao: (cdCidadao: number, dados: CidadaoEntrada, opcoes?: { manterIdentificacao?: boolean }) => atualizarCidadao(cdCidadao, dados, opcoes),
  agendarConsulta: async () => ({ cdConsulta: 99 }),
}));

beforeEach(() => {
  navigate.mockReset();
  atualizarCidadao.mockClear();
  estado = {
    dtSemente: "2026-11-18", cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [], consultas: [], cdCidadaoAtual: 5,
    cidadaos: [cadastro],
    unidades: [{ cdUnidade: 1, nmUnidade: "UBS Centro", tpUnidade: "UBS" } as EstadoSimulador["unidades"][number]],
    horarios: [{ cdHorario: 1, cdUnidade: 1, dtHorario: new Date(2026, 10, 20, 9).toISOString(), nrDuracaoMin: 20, flOcupado: false }],
  };
});

describe("Agendar: dados de identificação (RF27)", () => {
  it("mostra CNS, nascimento, nome e sexo como texto e confere só celular e contato", async () => {
    render(<Agendar cdHorario={1} cdOferta={0} />);
    for (const id of ["nmCidadao", "nrCns", "dtNascimento", "dsSexo"]) expect(document.getElementById(id)).toBeNull();
    expect(screen.getByText("090000000000005")).toBeInTheDocument();
    expect(screen.getByText("Ana Beatriz")).toBeInTheDocument();
    expect(screen.getByText("14/05/2001")).toBeInTheDocument();
    expect(screen.getByText("Feminino")).toBeInTheDocument();
    expect(screen.getByText(AVISO_IDENTIFICACAO)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Celular com DDD"), { target: { value: "(11) 97777-0000" } });
    fireEvent.change(screen.getByLabelText("Contato de recado (opcional)"), { target: { value: "Mãe" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));
    await waitFor(() => expect(atualizarCidadao).toHaveBeenCalled());
    expect(atualizarCidadao).toHaveBeenCalledWith(5, expect.objectContaining({
      nrCns: "090000000000005", dtNascimento: "2001-05-14", nmCidadao: "Ana Beatriz", dsSexo: "F", nrCelular: "(11) 97777-0000", nmContatoRecado: "Mãe",
    }), { manterIdentificacao: true });
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/sucesso", search: { consulta: 99 } }));
  });
});
