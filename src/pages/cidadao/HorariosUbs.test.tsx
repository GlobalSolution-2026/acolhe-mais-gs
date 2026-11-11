import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import { HorariosUbs } from "./HorariosUbs";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => navigate,
}));

let estado: EstadoSimulador;
const entrarNaListaDoDia = vi.fn();
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado, obterEstado: () => estado, entrarNaListaDoDia }),
}));

beforeEach(() => {
  navigate.mockReset();
  entrarNaListaDoDia.mockReset();
  estado = {
    dtSemente: "2026-11-11", consultas: [], cidadaos: [], cdUnidadeRecepcao: 1, orientacoes: [], listaDoDia: [], ofertas: [],
    unidades: [{ cdUnidade: 2, nmUnidade: "UBS Centro", tpUnidade: "UBS", dsEndereco: "", nrCep: "04010-100", nrTelefone: "" }],
    // Sem horário livre: aparece "Entrar na lista do dia".
    horarios: [{ cdHorario: 1, cdUnidade: 2, dtHorario: new Date(Date.now() + 86_400_000).toISOString(), nrDuracaoMin: 20, flOcupado: true }],
    orientacaoAtual: { cdQueixa: "GARGANTA", nrCep: "04010-100", respostas: {}, ordem: [],
      resultado: { cdOrientacao: 77, dsCor: "VERDE", dsDestino: "UBS", sinaisMarcados: [], nrDor: 2, flElevadaModelo: false } },
    cdCidadaoAtual: null,
  };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});

describe("HorariosUbs: entrar na lista do dia exige login", () => {
  it("sem login, vai para Entrar com o destino e a UBS, sem incluir na lista", async () => {
    render(<HorariosUbs cdUnidade={2} />);
    fireEvent.click(await screen.findByRole("button", { name: /Entrar na lista do dia/ }, { timeout: 3000 }));
    expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/entrar", search: { horario: 0, oferta: 0, destino: "lista-do-dia", ubs: 2 } });
    expect(entrarNaListaDoDia).not.toHaveBeenCalled();
  });

  it("com login, inclui na lista com a cor e o código da orientação e abre a lista", async () => {
    estado.cdCidadaoAtual = 1;
    render(<HorariosUbs cdUnidade={2} />);
    fireEvent.click(await screen.findByRole("button", { name: /Entrar na lista do dia/ }, { timeout: 3000 }));
    expect(entrarNaListaDoDia).toHaveBeenCalledWith(2, "VERDE", 77);
    expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/lista-do-dia" });
  });
});
