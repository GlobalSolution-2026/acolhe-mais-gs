import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface Props {
  id: string;
  label: string;
  registro: UseFormRegisterReturn;
  erro?: FieldError;
  tipo?: string;
  multilinha?: boolean;
  placeholder?: string;
}

export function CampoFormulario({ id, label, registro, erro, tipo = "text", multilinha, placeholder }: Props) {
  const base = `w-full rounded-[12px] border bg-branco px-4 text-texto outline-none focus:ring-2 focus:ring-primaria ${erro ? "border-gravidade-vermelho" : "border-borda"}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">{label}</label>
      {multilinha ? (
        <textarea id={id} rows={5} placeholder={placeholder} aria-invalid={!!erro} className={`${base} py-3`} {...registro} />
      ) : (
        <input id={id} type={tipo} placeholder={placeholder} aria-invalid={!!erro} className={`${base} min-h-12`} {...registro} />
      )}
      {erro && <p className="text-sm font-semibold text-gravidade-vermelho">{erro.message}</p>}
    </div>
  );
}
