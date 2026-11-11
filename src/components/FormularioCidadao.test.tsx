import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CidadaoEntrada } from "@/types";
import { FormularioCidadao } from "./FormularioCidadao";

function preencher() {
  fireEvent.change(screen.getByLabelText("Nome completo"), { target: { value: "Ana Teste" } });
  fireEvent.change(screen.getByLabelText("Cartão SUS (15 números)"), { target: { value: "123456789012345" } });
  fireEvent.change(screen.getByLabelText("Data de nascimento"), { target: { value: "1960-02-02" } });
  fireEvent.change(screen.getByLabelText("Sexo"), { target: { value: "F" } });
}

describe("FormularioCidadao: celular", () => {
  it("no app, o celular é obrigatório e não há a opção 'Não tem telefone'", async () => {
    const aoEnviar = vi.fn();
    render(<FormularioCidadao valoresIniciais={{}} nrCep="04010-100" aoEnviar={aoEnviar} textoBotao="Salvar" enviando={false} />);
    expect(screen.queryByRole("checkbox", { name: "Não tem telefone" })).not.toBeInTheDocument();
    preencher();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe o celular com DDD.")).toBeInTheDocument();
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it("com celularOpcional, 'Não tem telefone' esconde o celular, avisa e envia sem número", async () => {
    const aoEnviar = vi.fn<(d: CidadaoEntrada) => void>();
    render(<FormularioCidadao valoresIniciais={{}} nrCep="04010-100" aoEnviar={aoEnviar} textoBotao="Salvar" enviando={false} celularOpcional />);
    preencher();
    fireEvent.click(screen.getByRole("checkbox", { name: "Não tem telefone" }));
    expect(screen.queryByLabelText("Celular com DDD")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Sem telefone e sem contato de recado");
    fireEvent.change(screen.getByLabelText("Telefone do contato de recado (opcional)"), { target: { value: "(11) 96666-0000" } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(aoEnviar).toHaveBeenCalled());
    expect(aoEnviar.mock.calls[0]?.[0]).toMatchObject({ nmCidadao: "Ana Teste", nrCelular: "", nrContatoRecado: "(11) 96666-0000" });
  });

  it("com celularOpcional mas sem marcar a opção, o celular continua obrigatório", async () => {
    const aoEnviar = vi.fn();
    render(<FormularioCidadao valoresIniciais={{}} nrCep="04010-100" aoEnviar={aoEnviar} textoBotao="Salvar" enviando={false} celularOpcional />);
    preencher();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe o celular com DDD.")).toBeInTheDocument();
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it("cadastro conferido sem celular já vem com 'Não tem telefone' marcado", () => {
    render(<FormularioCidadao valoresIniciais={{ nmCidadao: "B", nrCelular: "", nrContatoRecado: "" }} nrCep="04010-100" aoEnviar={vi.fn()} textoBotao="Salvar" enviando={false} celularOpcional />);
    expect(screen.getByRole("checkbox", { name: "Não tem telefone" })).toBeChecked();
    expect(screen.queryByLabelText("Celular com DDD")).not.toBeInTheDocument();
  });
});
