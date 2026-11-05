import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiCheckCircle } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { Pagina } from "./Pagina";

interface FormContato {
  nome: string;
  email: string;
  mensagem: string;
}

export function Contato() {
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormContato>();

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 400));
    setEnviado(true);
    reset();
  };

  return (
    <Pagina titulo="Contato" subtitulo="Fale com a equipe do Acolhe+.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto flex max-w-xl flex-col gap-5 rounded-[12px] border border-borda bg-branco p-6 shadow-leve">
        {enviado && (
          <p className="flex items-center gap-2 rounded-[12px] bg-mentaSuave p-4 font-semibold text-primaria" role="status">
            <FiCheckCircle /> Mensagem enviada! Responderemos em breve.
          </p>
        )}
        <CampoFormulario id="nome" label="Nome" erro={errors.nome}
          registro={register("nome", { required: "Informe seu nome.", minLength: { value: 2, message: "Nome muito curto." }, maxLength: { value: 100, message: "Máximo de 100 caracteres." } })} />
        <CampoFormulario id="email" label="E-mail" tipo="email" erro={errors.email}
          registro={register("email", { required: "Informe seu e-mail.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "E-mail inválido." } })} />
        <CampoFormulario id="mensagem" label="Mensagem" multilinha erro={errors.mensagem}
          registro={register("mensagem", { required: "Escreva sua mensagem.", minLength: { value: 10, message: "Escreva pelo menos 10 caracteres." }, maxLength: { value: 1000, message: "Máximo de 1000 caracteres." } })} />
        <button type="submit" disabled={isSubmitting} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
          {isSubmitting ? "Enviando..." : "Enviar mensagem"}
        </button>
      </form>
    </Pagina>
  );
}
