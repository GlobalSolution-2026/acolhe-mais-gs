import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegendaCores } from "./LegendaCores";

describe("LegendaCores", () => {
  it("mostra as 5 cores do 1 ao 5", () => {
    render(<LegendaCores />);
    const itens = screen.getAllByRole("listitem");
    expect(itens).toHaveLength(5);
    ["Vermelho", "Laranja", "Amarelo", "Verde", "Azul"].forEach((nome, i) => {
      expect(itens[i]).toHaveTextContent(`Nível ${i + 1}:`);
      expect(itens[i]).toHaveTextContent(nome);
    });
    expect(screen.queryByText(/seu resultado/)).not.toBeInTheDocument();
  });

  it("marca \"(seu resultado)\" só na cor do destaque", () => {
    render(<LegendaCores destaque="AMARELO" />);
    const itens = screen.getAllByRole("listitem");
    expect(screen.getAllByText(/seu resultado/)).toHaveLength(1);
    expect(itens[2]).toHaveTextContent("(seu resultado)");
  });
});
