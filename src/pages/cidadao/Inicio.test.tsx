import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Inicio } from "./Inicio";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));

const iniciarOrientacao = vi.fn();
vi.mock("@/context/SimuladorContext", () => ({
  useSimulador: () => ({ estado: { orientacaoAtual: null }, iniciarOrientacao }),
}));

vi.mock("@/services/api", () => ({ buscarEndereco: () => Promise.resolve(null) }));

describe("Início: CEP opcional", () => {
  beforeEach(() => {
    navigate.mockClear();
    iniciarOrientacao.mockClear();
  });

  it("sem CEP, a queixa abre a orientação (a orientação nunca trava)", async () => {
    render(<Inicio />);
    expect(screen.getByLabelText("Seu CEP (opcional)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Dor de garganta/ }));
    await waitFor(() => expect(iniciarOrientacao).toHaveBeenCalledWith("GARGANTA", "", expect.anything()));
    expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/orientacao" });
  });

  it("CEP incompleto bloqueia com a mensagem de 8 números", async () => {
    render(<Inicio />);
    fireEvent.change(screen.getByLabelText("Seu CEP (opcional)"), { target: { value: "0401" } });
    fireEvent.click(screen.getByRole("button", { name: /Dor de garganta/ }));
    expect(await screen.findByText("O CEP tem 8 números.")).toBeInTheDocument();
    expect(iniciarOrientacao).not.toHaveBeenCalled();
  });
});
