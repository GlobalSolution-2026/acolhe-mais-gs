import { useForm } from "react-hook-form";
import { FiMapPin } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { mascararCep } from "@/services/cep";

interface Props {
  /** Texto acima do campo (ex.: "Informe seu CEP para ver a UPA mais próxima."). */
  mensagem: string;
  /** Recebe o CEP com a máscara (00000-000). */
  onInformar: (nrCep: string) => void;
  textoBotao?: string;
}

/**
 * Campo de CEP para quem pulou o CEP no Início (ele é opcional para a orientação nunca travar).
 * Sem CEP, as telas não indicam a unidade "mais próxima" (seria um palpite) e pedem o CEP aqui.
 */
export function CampoCepOpcional({ mensagem, onInformar, textoBotao = "Ver a mais próxima" }: Props) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitted } } = useForm<{ cep: string }>({
    defaultValues: { cep: "" },
  });
  const registroCep = register("cep", {
    required: "Informe o CEP.",
    pattern: { value: /^\d{5}-\d{3}$/, message: "O CEP tem 8 números." },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue("cep", mascararCep(e.target.value), { shouldValidate: isSubmitted });
    },
  });

  return (
    <form onSubmit={handleSubmit(({ cep }) => onInformar(cep))} noValidate
      className="flex flex-col gap-3 rounded-[12px] border border-borda bg-branco p-4">
      <p className="font-semibold">{mensagem}</p>
      <CampoFormulario id="cepOpcional" label="Seu CEP" placeholder="00000-000" registro={registroCep} erro={errors.cep} />
      <button type="submit" className="btn border border-borda bg-branco text-primaria">
        <FiMapPin /> {textoBotao}
      </button>
    </form>
  );
}
