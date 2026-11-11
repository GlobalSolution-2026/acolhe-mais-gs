import { useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface Props {
  id: string;
  label: string;
  registro: UseFormRegisterReturn;
  erro?: FieldError | undefined;
  tipo?: string;
  multilinha?: boolean;
  placeholder?: string;
  /** Campo de senha com botão Mostrar/Ocultar. */
  alternarSenha?: boolean;
}

export function CampoFormulario({ id, label, registro, erro, tipo = "text", multilinha, placeholder, alternarSenha }: Props) {
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const base = `w-full rounded-[12px] border bg-branco px-4 text-texto outline-none focus:ring-2 focus:ring-primaria ${erro ? "border-gravidade-vermelho" : "border-borda"}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">{label}</label>
      {multilinha ? (
        <textarea id={id} rows={5} placeholder={placeholder} aria-invalid={!!erro} className={`${base} py-3`} {...registro} />
      ) : alternarSenha ? (
        <div className="relative">
          <input id={id} type={senhaVisivel ? "text" : tipo} placeholder={placeholder} aria-invalid={!!erro} className={`${base} min-h-12 pr-24`} {...registro} />
          <button type="button" onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"} aria-pressed={senhaVisivel} aria-controls={id}
            className="absolute right-1 top-1/2 min-h-10 -translate-y-1/2 rounded-[10px] px-3 text-sm font-bold text-primaria hover:bg-fundo">
            {senhaVisivel ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      ) : (
        <input id={id} type={tipo} placeholder={placeholder} aria-invalid={!!erro} className={`${base} min-h-12`} {...registro} />
      )}
      {erro && <p className="text-sm font-semibold text-gravidade-vermelho">{erro.message}</p>}
    </div>
  );
}
