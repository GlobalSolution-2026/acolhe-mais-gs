import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SimuladorProvider, useSimulador, type EstadoSimulador } from "@/context/SimuladorContext";
import { CriarConta } from "./CriarConta";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => navigate,
}));

let visto: EstadoSimulador | null = null;
function PrepararOrientacao() {
  const { iniciarOrientacao, definirResultado } = useSimulador();
  useEffect(() => {
    iniciarOrientacao("GARGANTA", "04010-100");
    definirResultado({ cdOrientacao: 91, dsCor: "AZUL", dsDestino: "UBS", sinaisMarcados: [], nrDor: 1, flElevadaModelo: false });
  }, [iniciarOrientacao, definirResultado]);
  return null;
}
function Espiao() {
  visto = useSimulador().estado;
  return null;
}

beforeEach(() => {
  localStorage.clear();
  navigate.mockReset();
  visto = null;
});

describe("Criar conta vindo da tela de horários (lista do dia da UBS)", () => {
  it("cria a conta, entra na lista do dia da UBS com a orientação e volta para ela", async () => {
    render(
      <SimuladorProvider>
        <PrepararOrientacao />
        <CriarConta cdHorario={0} cdOferta={0} destino="lista-do-dia" cdUnidade={3} />
        <Espiao />
      </SimuladorProvider>,
    );
    await waitFor(() => expect(visto?.orientacaoAtual?.resultado?.cdOrientacao).toBe(91));
    const orientacaoAntes = visto?.orientacaoAtual;
    fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Nova Pessoa" } });
    fireEvent.change(screen.getByLabelText("Cartão SUS (15 números)"), { target: { value: "123123123123123" } });
    fireEvent.change(screen.getByLabelText("Celular com DDD"), { target: { value: "(11) 97777-1234" } });
    fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText("Sexo"), { target: { value: "F" } });
    fireEvent.change(screen.getByLabelText("Senha (mínimo 6 caracteres)"), { target: { value: "segredo1" } });
    fireEvent.change(screen.getByLabelText("Confirme a senha"), { target: { value: "segredo1" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/lista-do-dia" }), { timeout: 3000 });
    const nova = visto?.cidadaos.find((c) => c.nrCns === "123123123123123");
    expect(visto?.listaDoDia.find((e) => e.flCidadao)).toMatchObject({ cdUnidade: 3, cdCidadao: nova?.cdCidadao, cdOrientacao: 91, dsCor: "AZUL" });
    expect(visto?.orientacaoAtual).toEqual(orientacaoAntes);
  });
});
