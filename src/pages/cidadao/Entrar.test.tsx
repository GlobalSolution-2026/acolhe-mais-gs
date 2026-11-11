import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SimuladorProvider, useSimulador, type EstadoSimulador } from "@/context/SimuladorContext";
import { CONTA_DEMO } from "@/data/contaDemo";
import { Entrar } from "./Entrar";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => navigate,
}));

let visto: EstadoSimulador | null = null;

/** Cidadão sem login com orientação em andamento e na lista do dia da UBS 2 (usa o Provider real). */
function Preparar() {
  const { iniciarOrientacao, entrarNaListaDoDia } = useSimulador();
  useEffect(() => {
    iniciarOrientacao("GARGANTA", "04010-100");
    entrarNaListaDoDia(2, "VERDE", 77);
  }, [iniciarOrientacao, entrarNaListaDoDia]);
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

describe("Entrar a partir da lista do dia", () => {
  it("volta para a lista do dia, liga a entrada à conta e mantém a orientação", async () => {
    render(
      <SimuladorProvider>
        <Preparar />
        <Entrar cdHorario={0} cdOferta={0} destino="lista-do-dia" cdUnidade={0} />
        <Espiao />
      </SimuladorProvider>,
    );
    expect(screen.getByText("Entre para receber a vaga da lista do dia no seu nome.")).toBeInTheDocument();
    await waitFor(() => expect(visto?.listaDoDia.some((e) => e.flCidadao)).toBe(true));
    const orientacaoAntes = visto?.orientacaoAtual;

    fireEvent.change(screen.getByLabelText("Cartão SUS (CNS)"), { target: { value: CONTA_DEMO.nrCns } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: CONTA_DEMO.dsSenha } });
    expect(screen.getByRole("button", { name: "Mostrar senha" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/lista-do-dia" }), { timeout: 3000 });
    const minha = visto?.listaDoDia.find((e) => e.flCidadao);
    expect(minha).toMatchObject({ cdUnidade: 2, cdCidadao: CONTA_DEMO.cdCidadao, cdOrientacao: 77, status: "AGUARDANDO" });
    expect(minha?.nmCidadao).not.toBe("Você");
    expect(visto?.cdCidadaoAtual).toBe(CONTA_DEMO.cdCidadao);
    expect(visto?.orientacaoAtual).toEqual(orientacaoAntes);
  });
});

/** Orientação VERDE em andamento, ainda sem lista do dia (o cidadão veio da tela de horários da UBS 2). */
function PrepararOrientacao() {
  const { iniciarOrientacao, definirResultado } = useSimulador();
  useEffect(() => {
    iniciarOrientacao("GARGANTA", "04010-100");
    definirResultado({ cdOrientacao: 88, dsCor: "VERDE", dsDestino: "UBS", sinaisMarcados: [], nrDor: 2, flElevadaModelo: false });
  }, [iniciarOrientacao, definirResultado]);
  return null;
}

describe("Entrar vindo da tela de horários (lista do dia da UBS)", () => {
  it("depois do login, entra na lista do dia da UBS com a orientação e volta para ela", async () => {
    render(
      <SimuladorProvider>
        <PrepararOrientacao />
        <Entrar cdHorario={0} cdOferta={0} destino="lista-do-dia" cdUnidade={2} />
        <Espiao />
      </SimuladorProvider>,
    );
    await waitFor(() => expect(visto?.orientacaoAtual?.resultado?.cdOrientacao).toBe(88));
    expect(screen.getByText(/Entre para entrar na lista do dia da /)).toBeInTheDocument();
    expect(visto?.listaDoDia.some((e) => e.flCidadao)).toBe(false);
    const orientacaoAntes = visto?.orientacaoAtual;
    fireEvent.change(screen.getByLabelText("Cartão SUS (CNS)"), { target: { value: CONTA_DEMO.nrCns } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: CONTA_DEMO.dsSenha } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/lista-do-dia" }), { timeout: 3000 });
    expect(visto?.listaDoDia.find((e) => e.flCidadao)).toMatchObject({ cdUnidade: 2, cdCidadao: CONTA_DEMO.cdCidadao, cdOrientacao: 88, dsCor: "VERDE", status: "AGUARDANDO" });
    expect(visto?.orientacaoAtual).toEqual(orientacaoAntes);
  });
});
