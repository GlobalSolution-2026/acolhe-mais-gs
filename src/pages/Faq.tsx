import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Pagina } from "./Pagina";

const perguntas = [
  { p: "A plataforma faz diagnóstico?", r: "Não. O Acolhe+ apenas orienta sobre onde buscar atendimento. Ele não substitui a classificação de risco feita por profissionais de saúde." },
  { p: "É gratuito?", r: "Sim. A ideia é funcionar junto com o SUS, sem custo para o cidadão." },
  { p: "E se for uma emergência?", r: "Ligue 192 (SAMU) na hora. No app, o botão vermelho Emergência leva direto a essa orientação." },
  { p: "Como funciona a liberação de vagas?", r: "Antes da consulta, você confirma se vai. Se não puder, libera o horário e outra pessoa pode usar." },
  { p: "Preciso ter cadastro na UBS?", r: "Basta o Cartão Nacional de Saúde (CNS) e um CEP para encontrarmos a UBS mais perto." },
];

export function Faq() {
  const [aberta, setAberta] = useState<number | null>(0);
  return (
    <Pagina titulo="Perguntas frequentes">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {perguntas.map((item, i) => {
          const ativa = aberta === i;
          return (
            <div key={item.p} className="overflow-hidden rounded-[12px] border border-borda bg-branco shadow-leve">
              <button
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left font-bold"
                aria-expanded={ativa}
                onClick={() => setAberta(ativa ? null : i)}
              >
                {item.p}
                <FiChevronDown className={`shrink-0 transition-transform ${ativa ? "rotate-180" : ""}`} size={22} />
              </button>
              {ativa && <p className="px-5 pb-5 text-textoSuave">{item.r}</p>}
            </div>
          );
        })}
      </div>
    </Pagina>
  );
}
