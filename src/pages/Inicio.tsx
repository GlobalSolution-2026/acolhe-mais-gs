import { Link } from "@tanstack/react-router";
import { FiArrowRight, FiCalendar, FiCompass, FiRefreshCw } from "react-icons/fi";

export function Inicio() {
  return (
    <>
      <section className="bg-primaria text-branco">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:py-24">
          <p className="w-fit rounded-full bg-menta px-3 py-1 text-sm font-bold text-primariaEscura">Orientação no SUS</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            A pessoa certa, no lugar certo, na vaga que ia sobrar.
          </h1>
          <p className="max-w-2xl text-lg opacity-90">
            O Acolhe+ mostra se você deve chamar o SAMU, ir ao pronto-socorro, à UPA ou à UBS. Nos casos leves, já marca sua consulta na UBS.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/solucao" className="btn bg-menta text-primariaEscura hover:bg-mentaSuave">
              Conheça a solução <FiArrowRight />
            </Link>
            <Link to="/simulador" className="btn border-2 border-menta text-branco hover:bg-primariaEscura">
              Abrir simulador
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-2xl font-extrabold text-primaria">O problema, em resumo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icone: FiCompass, t: "UPAs lotadas", d: "Muitos casos leves vão à UPA porque a pessoa não sabe onde buscar ajuda." },
            { icone: FiCalendar, t: "Consultas perdidas", d: "Na UBS, muitas pessoas faltam e o horário fica vazio." },
            { icone: FiRefreshCw, t: "Vaga reaproveitada", d: "O Acolhe+ confirma presença e libera o horário para quem precisa." },
          ].map(({ icone: Icone, t, d }) => (
            <div key={t} className="rounded-[12px] border border-borda bg-branco p-6 shadow-leve">
              <Icone size={28} className="mb-3 text-primaria" />
              <h3 className="mb-1 text-lg font-bold">{t}</h3>
              <p className="text-textoSuave">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
