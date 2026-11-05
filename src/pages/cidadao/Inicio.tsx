import { useNavigate } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import type { IconType } from "react-icons";
import { FiThermometer, FiWind, FiDroplet, FiFrown, FiZap } from "react-icons/fi";
import { queixas } from "@/data/queixas";
import { CampoFormulario } from "@/components/CampoFormulario";
import { useSimulador } from "@/context/SimuladorContext";
import type { CodigoQueixa } from "@/types/orientacao";

const ICONES: Record<CodigoQueixa, IconType> = {
  GRIPAL: FiThermometer,
  GARGANTA: FiWind,
  DIARREIA: FiDroplet,
  CABECA: FiFrown,
  URINA: FiZap,
};

function mascararCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function Inicio() {
  const { estado, iniciarOrientacao } = useSimulador();
  const navigate = useNavigate();
  const { register, control, handleSubmit, formState: { errors } } = useForm<{ cep: string }>({
    defaultValues: { cep: estado.orientacaoAtual?.nrCep ?? "" },
  });
  const cep = useWatch({ control, name: "cep" });
  const cepOk = /^\d{5}-\d{3}$/.test(cep ?? "");

  const escolher = (codigo: CodigoQueixa) =>
    handleSubmit(({ cep }) => {
      iniciarOrientacao(codigo, cep);
      void navigate({ to: "/inicio/orientacao" });
    })();

  const registroCep = register("cep", {
    required: "Informe o CEP para continuar.",
    pattern: { value: /^\d{5}-\d{3}$/, message: "O CEP tem 8 números." },
    onChange: (e) => {
      e.target.value = mascararCep(e.target.value);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <CampoFormulario id="cep" label="Seu CEP" placeholder="00000-000" tipo="text" registro={registroCep} erro={errors.cep} />
      <div>
        <h1 className="mb-1 text-2xl font-extrabold text-primaria">O que você está sentindo?</h1>
        {!cepOk && <p className="text-base text-textoSuave">Preencha o CEP para escolher.</p>}
      </div>
      <div className="grid gap-3">
        {queixas.map((q) => {
          const Icone = ICONES[q.codigo];
          return (
            <button
              key={q.codigo}
              onClick={() => escolher(q.codigo)}
              aria-disabled={!cepOk}
              className={`flex min-h-20 items-center gap-4 rounded-[12px] border border-borda bg-branco p-4 text-left text-lg font-bold shadow-leve transition ${cepOk ? "hover:border-primaria" : "opacity-50"}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mentaSuave text-primaria">
                <Icone size={26} />
              </span>
              {q.nmQueixa}
            </button>
          );
        })}
      </div>
    </div>
  );
}
