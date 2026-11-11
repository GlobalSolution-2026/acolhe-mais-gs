import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { perguntas } from "@/data/perguntas";
import type { Pergunta } from "@/types/orientacao";
import { Multipla } from "@/components/RespostasPergunta";

const pergunta = (codigo: string): Pergunta => perguntas.find((p) => p.codigo === codigo)!;
const opcao = (nome: string) => screen.getByRole("button", { name: nome });

describe("Multipla", () => {
  it("bloqueia o Continuar até marcar uma opção", () => {
    const onResponder = vi.fn();
    render(<Multipla pergunta={pergunta("P4")} onResponder={onResponder} />);
    expect(opcao("Continuar")).toBeDisabled();
    expect(screen.getByText("Marque pelo menos uma opção.")).toBeInTheDocument();
    fireEvent.click(opcao("Continuar"));
    expect(onResponder).not.toHaveBeenCalled();

    fireEvent.click(opcao("Confuso"));
    expect(opcao("Continuar")).toBeEnabled();
    fireEvent.click(opcao("Continuar"));
    expect(onResponder).toHaveBeenCalledWith(["CONFUSO"]);
  });

  it("'Nenhum destes' desmarca as outras opções, e marcar um sinal desmarca 'Nenhum destes'", () => {
    const onResponder = vi.fn();
    render(<Multipla pergunta={pergunta("P7")} onResponder={onResponder} />);
    fireEvent.click(opcao("Boca muito seca"));
    fireEvent.click(opcao("Urinando bem menos"));
    fireEvent.click(opcao("Nenhum destes"));
    expect(opcao("Nenhum destes")).toHaveAttribute("aria-pressed", "true");
    expect(opcao("Boca muito seca")).toHaveAttribute("aria-pressed", "false");
    expect(opcao("Urinando bem menos")).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(opcao("Não sei"));
    expect(opcao("Não sei")).toHaveAttribute("aria-pressed", "true");
    expect(opcao("Nenhum destes")).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(opcao("Boca muito seca"));
    expect(opcao("Não sei")).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(opcao("Continuar"));
    expect(onResponder).toHaveBeenCalledWith(["BOCA_SECA"]);
  });

  it("a P0 continua liberando o Continuar sem nada marcado", () => {
    const onResponder = vi.fn();
    render(<Multipla pergunta={pergunta("P0")} onResponder={onResponder} />);
    expect(opcao("Continuar")).toBeEnabled();
    expect(screen.queryByText("Marque pelo menos uma opção.")).not.toBeInTheDocument();
    fireEvent.click(opcao("Continuar"));
    expect(onResponder).toHaveBeenCalledWith([]);
  });
});
