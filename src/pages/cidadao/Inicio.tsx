import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { IconType } from "react-icons";
import { FiThermometer, FiWind, FiDroplet, FiFrown, FiZap } from "react-icons/fi";
import { queixas } from "@/data/queixas";
import { CampoFormulario } from "@/components/CampoFormulario";
import { useSimulador } from "@/context/SimuladorContext";
import { buscarEndereco } from "@/services/api";
import { formatarEndereco } from "@/services/cep";
import type { CodigoQueixa, EnderecoCep } from "@/types/orientacao";

type BuscaCep = { cep: string; status: "OK" | "NAO_ENCONTRADO" | "FALHA"; endereco: EnderecoCep | null };

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
  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitted } } = useForm<{
    cep: string;
    nrEndereco: string;
    dsComplemento: string;
  }>({
    defaultValues: {
      cep: estado.orientacaoAtual?.nrCep ?? "",
      nrEndereco: estado.orientacaoAtual?.nrEndereco ?? "",
      dsComplemento: estado.orientacaoAtual?.dsComplemento ?? "",
    },
  });
  const cep = useWatch({ control, name: "cep" });
  const cepOk = /^\d{5}-\d{3}$/.test(cep ?? "");

  // O endereço é só um complemento: a busca nunca bloqueia a orientação (fluxo de urgência).
  const [busca, setBusca] = useState<BuscaCep | null>(null);
  // O resultado só vale para o CEP atual; enquanto não chega, está "buscando".
  const buscaAtual = cepOk && busca?.cep === cep ? busca : null;

  useEffect(() => {
    if (!cepOk) return;
    const controle = new AbortController();
    buscarEndereco(cep, controle.signal)
      .then((endereco) => {
        if (!controle.signal.aborted) setBusca({ cep, endereco, status: endereco ? "OK" : "NAO_ENCONTRADO" });
      })
      .catch(() => {
        if (!controle.signal.aborted) setBusca({ cep, endereco: null, status: "FALHA" });
      });
    return () => controle.abort();
  }, [cep, cepOk]);

  const escolher = (codigo: CodigoQueixa) =>
    handleSubmit(({ cep, nrEndereco, dsComplemento }) => {
      iniciarOrientacao(codigo, cep, {
        endereco: buscaAtual?.endereco ?? null,
        nrEndereco: nrEndereco.trim(),
        dsComplemento: dsComplemento.trim(),
      });
      void navigate({ to: "/cidadao/orientacao" });
    })();

  const registroCep = register("cep", {
    required: "Informe o CEP para continuar.",
    pattern: { value: /^\d{5}-\d{3}$/, message: "O CEP tem 8 números." },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue("cep", mascararCep(e.target.value), { shouldValidate: isSubmitted });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <CampoFormulario id="cep" label="Seu CEP" placeholder="00000-000" tipo="text" registro={registroCep} erro={errors.cep} />
        {cepOk && (
          <p className="text-sm text-textoSuave" aria-live="polite">
            {!buscaAtual && "Buscando endereço..."}
            {buscaAtual?.endereco && formatarEndereco(buscaAtual.endereco)}
            {buscaAtual?.status === "NAO_ENCONTRADO" && "Não encontramos este CEP, mas você pode continuar."}
            {buscaAtual?.status === "FALHA" && "Não foi possível buscar o endereço agora. Você pode continuar só com o CEP."}
          </p>
        )}
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <CampoFormulario id="nrEndereco" label="Número (opcional)" registro={register("nrEndereco", { maxLength: 10 })} />
          <CampoFormulario id="dsComplemento" label="Complemento (opcional)" registro={register("dsComplemento", { maxLength: 60 })} />
        </div>
      </div>
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
