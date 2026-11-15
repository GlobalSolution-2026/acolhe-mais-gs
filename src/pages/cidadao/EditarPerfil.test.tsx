import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVISO_IDENTIFICACAO } from "@/components/FormularioCidadao";
import { SimuladorProvider, useSimulador } from "@/context/SimuladorContext";
import { CONTA_DEMO } from "@/data/contaDemo";
import { EditarPerfil } from "./EditarPerfil";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => navigate,
}));

let sim: ReturnType<typeof useSimulador> | null = null;
function Espiao() {
  sim = useSimulador();
  return null;
}
const demo = () => sim?.estado.cidadaos.find((c) => c.cdCidadao === CONTA_DEMO.cdCidadao);

beforeEach(() => {
  localStorage.clear();
  navigate.mockReset();
  sim = null;
});

function montar() {
  render(<SimuladorProvider><Espiao /><EditarPerfil /></SimuladorProvider>);
  act(() => sim?.definirCidadaoAtual(CONTA_DEMO.cdCidadao));
}

describe("Editar dados do perfil (RF27)", () => {
  it("mostra CNS, nascimento, nome e sexo só como texto, com o aviso da recepção", () => {
    montar();
    const original = demo();
    for (const id of ["nmCidadao", "nrCns", "dtNascimento", "dsSexo"]) expect(document.getElementById(id)).toBeNull();
    expect(screen.queryByLabelText(/Cartão SUS/)).toBeNull();
    expect(screen.queryByLabelText("Nome completo")).toBeNull();
    expect(screen.queryByLabelText("Data de nascimento")).toBeNull();
    expect(screen.queryByLabelText("Sexo")).toBeNull();
    expect(screen.getByText(original?.nrCns ?? "-")).toBeInTheDocument();
    expect(screen.getByText(original?.nmCidadao ?? "-")).toBeInTheDocument();
    expect(screen.getByText("12/03/1958")).toBeInTheDocument();
    expect(screen.getByText("Feminino")).toBeInTheDocument();
    expect(screen.getByText(AVISO_IDENTIFICACAO)).toBeInTheDocument();
    expect(AVISO_IDENTIFICACAO).toBe("Para corrigir o Cartão SUS, a data de nascimento, o nome ou o sexo, procure a recepção da sua UBS.");
    expect(screen.getByText("Confira seu celular: é por ele que avisamos a confirmação e as vagas.")).toBeInTheDocument();
  });

  it("valida o celular (RF29) e salva celular e contato mantendo CNS, nascimento, nome e sexo", async () => {
    montar();
    const original = demo();
    fireEvent.change(screen.getByLabelText("Celular com DDD"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Celular inválido: use DDD + número.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Celular com DDD"), { target: { value: "(11) 95555-0000" } });
    fireEvent.change(screen.getByLabelText("Contato de recado (opcional)"), { target: { value: "Irmã" } });
    fireEvent.change(screen.getByLabelText("Telefone do contato de recado (opcional)"), { target: { value: "(11) 94444-0000" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: "/cidadao/perfil" }), { timeout: 3000 });
    expect(demo()).toMatchObject({
      nrCns: original?.nrCns, dtNascimento: original?.dtNascimento, nmCidadao: original?.nmCidadao, dsSexo: original?.dsSexo,
      nrCelular: "(11) 95555-0000", nmContatoRecado: "Irmã", nrContatoRecado: "(11) 94444-0000",
    });
  });
});
