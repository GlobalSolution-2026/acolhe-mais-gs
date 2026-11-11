import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import type { Consulta } from "@/types";
import { Consultas } from "./Consultas";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado }),
}));

const ESPERA = { timeout: 3000 };
const emHoras = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const consulta = (cdConsulta: number, horas: number, dsStatus: Consulta["dsStatus"]): Consulta => ({
  cdConsulta, cdHorario: cdConsulta, cdCidadao: 1, cdOrientacao: null, dtAgendamento: emHoras(-240), dtConfirmacao: null, dsCanalConfirmacao: null,
  dsStatus, vlProbFalta: .2, dsRiscoFalta: "BAIXO", nmUnidade: "UBS Centro", dtHorario: emHoras(horas),
});

beforeEach(() => {
  estado = {
    dtSemente: "2026-11-11", unidades: [], cidadaos: [], cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [],
    cdCidadaoAtual: 1,
    horarios: [
      { cdHorario: 1, cdUnidade: 1, dtHorario: emHoras(240), nrDuracaoMin: 20, flOcupado: true },
      { cdHorario: 2, cdUnidade: 1, dtHorario: emHoras(-48), nrDuracaoMin: 20, flOcupado: true },
    ],
    consultas: [consulta(1, 240, "AGENDADA"), consulta(2, -48, "REALIZADA")],
  };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});

describe("Consultas: cancelamento pelo cidadão", () => {
  it("pede confirmação na tela e Voltar não cancela", async () => {
    render(<Consultas />);
    fireEvent.click(await screen.findByRole("button", { name: /Não vou poder ir/ }, ESPERA));
    expect(screen.getByText("Tem certeza? O horário será liberado para outra pessoa.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.queryByText("Tem certeza? O horário será liberado para outra pessoa.")).not.toBeInTheDocument();
    expect(estado.consultas[0]?.dsStatus).toBe("AGENDADA");
  });

  it("ao confirmar, libera a consulta e o horário e agradece o aviso", async () => {
    render(<Consultas />);
    fireEvent.click(await screen.findByRole("button", { name: /Não vou poder ir/ }, ESPERA));
    fireEvent.click(screen.getByRole("button", { name: "Sim, cancelar a consulta" }));
    expect(await screen.findByText("Consulta cancelada. Obrigado por avisar: o horário vai para outra pessoa.", {}, ESPERA)).toBeInTheDocument();
    expect(estado.consultas[0]?.dsStatus).toBe("LIBERADA");
    expect(estado.horarios[0]?.flOcupado).toBe(false);
    expect(screen.getByText("Liberada para outra pessoa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Não vou poder ir/ })).not.toBeInTheDocument();
  });

  it("consulta que já aconteceu não mostra o botão", async () => {
    estado.consultas = [consulta(2, -48, "REALIZADA")];
    render(<Consultas />);
    expect(await screen.findByText("Realizada", {}, ESPERA)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Não vou poder ir/ })).not.toBeInTheDocument();
  });
});
