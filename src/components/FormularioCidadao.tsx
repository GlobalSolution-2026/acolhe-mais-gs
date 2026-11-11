import { useForm, useWatch } from "react-hook-form";
import type { CidadaoEntrada } from "@/types";
import { CampoFormulario } from "./CampoFormulario";

export interface CidadaoForm {
  nmCidadao: string;
  nrCns: string;
  nrCelular: string;
  dtNascimento: string;
  dsSexo: "F" | "M";
  nmContatoRecado: string;
  nrContatoRecado: string;
  dsSenha?: string;
  dsSenhaConfirmacao?: string;
  semTelefone?: boolean;
}

interface Props {
  valoresIniciais: Partial<CidadaoForm>;
  nrCep: string;
  aoEnviar: (dados: CidadaoEntrada, dsSenha?: string) => void;
  /** Criação de conta: pede senha e confirmação. */
  pedirSenha?: boolean;
  /** Balcão e "Agendar para quem chegou": permite cadastro sem celular ("Não tem telefone"). No app, fica obrigatório. */
  celularOpcional?: boolean;
  textoBotao: string;
  enviando: boolean;
}

/** Formulário de cadastro do cidadão (usado no agendamento, no perfil e na recepção). */
export function FormularioCidadao({ valoresIniciais, nrCep, aoEnviar, textoBotao, enviando, pedirSenha, celularOpcional }: Props) {
  const { register, handleSubmit, getValues, control, formState: { errors } } = useForm<CidadaoForm>({
    // Cadastro já conferido sem celular chega com "Não tem telefone" marcado.
    defaultValues: { ...valoresIniciais, semTelefone: Boolean(celularOpcional) && valoresIniciais.nrCelular === "" },
  });
  const marcouSemTelefone = useWatch({ control, name: "semTelefone" });
  const recado = useWatch({ control, name: "nrContatoRecado" }) ?? "";
  const semTelefone = Boolean(celularOpcional) && marcouSemTelefone === true;

  const enviar = handleSubmit((v) => {
    aoEnviar({
      nmCidadao: v.nmCidadao.trim(),
      nrCns: v.nrCns.replace(/\D/g, ""),
      nrCelular: semTelefone ? "" : (v.nrCelular ?? "").trim(),
      dtNascimento: v.dtNascimento,
      dsSexo: v.dsSexo,
      nmContatoRecado: v.nmContatoRecado.trim(),
      nrContatoRecado: v.nrContatoRecado.trim(),
      nrCep,
    }, pedirSenha ? v.dsSenha : undefined);
  });

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <CampoFormulario id="nmCidadao" label="Nome completo" erro={errors.nmCidadao}
        registro={register("nmCidadao", { required: "Informe o nome completo." })} />
      <CampoFormulario id="nrCns" label="Cartão SUS (15 números)" placeholder="000000000000000" erro={errors.nrCns}
        registro={register("nrCns", {
          required: "Informe o número do cartão SUS.",
          pattern: { value: /^\d{15}$/, message: "O cartão SUS tem 15 números." },
        })} />
      {celularOpcional && (
        <label className="flex min-h-12 items-center gap-3 font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-primaria" {...register("semTelefone")} />
          Não tem telefone
        </label>
      )}
      {!semTelefone && (
        <CampoFormulario id="nrCelular" label="Celular com DDD" placeholder="(11) 90000-0000" erro={errors.nrCelular}
          registro={register("nrCelular", {
            validate: (v) => {
              if (celularOpcional && getValues("semTelefone")) return true;
              if (!v?.trim()) return "Informe o celular com DDD.";
              return /^\d{10,11}$/.test(v.replace(/\D/g, "")) || "Celular inválido: use DDD + número.";
            },
          })} />
      )}
      <CampoFormulario id="dtNascimento" label="Data de nascimento" tipo="date" erro={errors.dtNascimento}
        registro={register("dtNascimento", { required: "Informe a data de nascimento." })} />
      <div className="flex flex-col gap-1">
        <label htmlFor="dsSexo" className="font-semibold">Sexo</label>
        <select id="dsSexo" aria-invalid={!!errors.dsSexo}
          className={`min-h-12 w-full rounded-[12px] border bg-branco px-4 text-texto outline-none focus:ring-2 focus:ring-primaria ${errors.dsSexo ? "border-gravidade-vermelho" : "border-borda"}`}
          {...register("dsSexo", { required: "Selecione o sexo." })}>
          <option value="">Selecione</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
        </select>
        {errors.dsSexo && <p className="text-sm font-semibold text-gravidade-vermelho">{errors.dsSexo.message}</p>}
      </div>
      <CampoFormulario id="nmContatoRecado" label="Contato de recado (opcional)" placeholder="Nome de alguém próximo" erro={errors.nmContatoRecado}
        registro={register("nmContatoRecado")} />
      <CampoFormulario id="nrContatoRecado" label="Telefone do contato de recado (opcional)" placeholder="(11) 90000-0000" erro={errors.nrContatoRecado}
        registro={register("nrContatoRecado", {
          validate: (v) => !v.trim() || /^\d{10,11}$/.test(v.replace(/\D/g, "")) || "Telefone inválido: use DDD + número.",
        })} />
      {semTelefone && !recado.trim() && (
        <p className="rounded-[12px] bg-mentaSuave p-3 text-sm font-semibold text-primaria" role="status">
          Sem telefone e sem contato de recado: a confirmação será presencial e a vaga não é liberada automaticamente.
        </p>
      )}
      {pedirSenha && (
        <>
          <CampoFormulario id="dsSenha" label="Senha (mínimo 6 caracteres)" tipo="password" alternarSenha erro={errors.dsSenha}
            registro={register("dsSenha", { required: "Crie uma senha.", minLength: { value: 6, message: "A senha precisa ter pelo menos 6 caracteres." } })} />
          <CampoFormulario id="dsSenhaConfirmacao" label="Confirme a senha" tipo="password" alternarSenha erro={errors.dsSenhaConfirmacao}
            registro={register("dsSenhaConfirmacao", { required: "Repita a senha.", validate: (v) => v === getValues("dsSenha") || "As senhas não são iguais." })} />
        </>
      )}
      <button type="submit" disabled={enviando} className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
        {enviando ? "Aguarde..." : textoBotao}
      </button>
    </form>
  );
}
