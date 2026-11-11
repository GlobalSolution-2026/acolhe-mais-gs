import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { conectarStore } from "@/services/api";
import { precisaConfirmar } from "@/services/regrasAgendamento";
import type { Consulta } from "@/types";
import { Pendentes } from "./Pendentes";

let estado: EstadoSimulador;
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado }),
}));

const ESPERA = { timeout: 3000 };
const emHoras = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

/** Uma consulta agendada no meio da janela de confirmação (longe das bordas, em qualquer dia da semana). */
function consultaNaJanela(): Consulta {
  const naJanela: Consulta[] = [];
  for (let h = 12; h <= 24 * 8; h++) {
    const c: Consulta = {
      cdConsulta: 1, cdHorario: 1, cdCidadao: 1, cdOrientacao: null, dtAgendamento: emHoras(-24 * 15), dtConfirmacao: null, dsCanalConfirmacao: null,
      dsStatus: "AGENDADA", vlProbFalta: .2, dsRiscoFalta: "BAIXO", nmUnidade: "UBS Centro", dtHorario: emHoras(h),
    };
    if (precisaConfirmar(c, new Date())) naJanela.push(c);
  }
  const meio = naJanela[Math.floor(naJanela.length / 2)];
  if (!meio) throw new Error("sem horário na janela de confirmação");
  return meio;
}

beforeEach(() => {
  const c = consultaNaJanela();
  estado = {
    dtSemente: "2026-11-11", unidades: [], cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [], cdCidadaoAtual: null,
    cidadaos: [{ cdCidadao: 1, nmCidadao: "Maria Silva", nrCns: "111222233334444", dtNascimento: "1980-01-01", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" }],
    horarios: [{ cdHorario: 1, cdUnidade: 1, dtHorario: c.dtHorario, nrDuracaoMin: 20, flOcupado: true }],
    consultas: [c],
  };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});

describe("Pendentes: cancelamento por telefone", () => {
  it("pede confirmação e, ao confirmar, libera a consulta e o horário", async () => {
    render(<Pendentes />);
    fireEvent.click(screen.getByRole("button", { name: /Cancelou por telefone/ }));
    expect(screen.getByText("Confirmar cancelamento? O horário será liberado para outra pessoa.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sim, cancelar a consulta" }));
    expect(await screen.findByText("Nenhuma consulta aguardando confirmação.", {}, ESPERA)).toBeInTheDocument();
    expect(estado.consultas[0]?.dsStatus).toBe("LIBERADA");
    expect(estado.horarios[0]?.flOcupado).toBe(false);
  });

  it("Voltar mantém a consulta", () => {
    render(<Pendentes />);
    fireEvent.click(screen.getByRole("button", { name: /Cancelou por telefone/ }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("button", { name: /Cancelou por telefone/ })).toBeInTheDocument();
    expect(estado.consultas[0]?.dsStatus).toBe("AGENDADA");
  });
});
