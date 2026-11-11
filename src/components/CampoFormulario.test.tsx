import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { CampoFormulario } from "./CampoFormulario";

function Formulario({ alternarSenha = false, onEnviar = () => {} }: { alternarSenha?: boolean; onEnviar?: () => void }) {
  const { register, handleSubmit } = useForm<{ dsSenha: string }>();
  return (
    <form onSubmit={handleSubmit(onEnviar)}>
      <CampoFormulario id="dsSenha" label="Senha" tipo="password" alternarSenha={alternarSenha} registro={register("dsSenha")} />
    </form>
  );
}

describe("CampoFormulario: mostrar/ocultar senha", () => {
  it("alterna o tipo do campo, o texto, o nome acessível e o aria-pressed", () => {
    render(<Formulario alternarSenha />);
    const campo = screen.getByLabelText("Senha");
    const botao = screen.getByRole("button", { name: "Mostrar senha" });
    expect(campo).toHaveAttribute("type", "password");
    expect(botao).toHaveTextContent("Mostrar");
    expect(botao).toHaveAttribute("aria-pressed", "false");
    expect(botao).toHaveAttribute("aria-controls", "dsSenha");

    fireEvent.click(botao);
    expect(campo).toHaveAttribute("type", "text");
    expect(botao).toHaveTextContent("Ocultar");
    expect(botao).toHaveAccessibleName("Ocultar senha");
    expect(botao).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(botao);
    expect(campo).toHaveAttribute("type", "password");
    expect(botao).toHaveAccessibleName("Mostrar senha");
  });

  it("o botão não envia o formulário", () => {
    const onEnviar = vi.fn();
    render(<Formulario alternarSenha onEnviar={onEnviar} />);
    const botao = screen.getByRole("button", { name: "Mostrar senha" });
    expect(botao).toHaveAttribute("type", "button");
    fireEvent.click(botao);
    expect(onEnviar).not.toHaveBeenCalled();
  });

  it("sem a opção, não mostra o botão", () => {
    render(<Formulario />);
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
