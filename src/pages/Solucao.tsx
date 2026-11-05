import { FiBell, FiCalendar, FiCompass, FiRefreshCw } from "react-icons/fi";
import { Pagina } from "./Pagina";

const etapas = [
  { icone: FiCompass, t: "Orientação", d: "A pessoa responde perguntas simples e vê se deve ir ao SAMU, pronto-socorro, UPA ou UBS." },
  { icone: FiCalendar, t: "Agendamento", d: "Se o caso é leve, escolhe um horário livre na UBS mais próxima." },
  { icone: FiBell, t: "Confirmação", d: "Perto da data, recebe um aviso para confirmar a presença." },
  { icone: FiRefreshCw, t: "Liberação de vagas", d: "Quem não pode ir libera o horário, que volta para outra pessoa." },
];

const indicadores = [
  { t: "Casos verdes e azuis nas UPAs", d: "Proporção de atendimentos leves que poderiam ir à UBS." },
  { t: "Taxa de absenteísmo", d: "Quantas consultas marcadas terminam em falta." },
  { t: "Reaproveitamento de horários", d: "Horários liberados que foram ocupados de novo." },
  { t: "Tempo até a consulta", d: "Dias entre a orientação e o atendimento na UBS." },
];

export function Solucao() {
  return (
    <Pagina titulo="A solução" subtitulo="Orientar, agendar e não deixar vaga sobrar.">
      <section className="mb-10 rounded-[12px] bg-mentaSuave p-6">
        <h2 className="mb-2 text-xl font-bold text-primaria">O problema</h2>
        <p>Casos leves lotam as UPAs enquanto consultas na UBS ficam vazias por falta.</p>
      </section>
      <h2 className="mb-4 text-2xl font-extrabold text-primaria">Como funciona</h2>
      <ol className="mb-12 grid gap-4 md:grid-cols-4">
        {etapas.map(({ icone: Icone, t, d }, i) => (
          <li key={t} className="relative rounded-[12px] border border-borda bg-branco p-5 shadow-leve">
            <span className="absolute -top-3 left-4 flex h-7 w-7 items-center justify-center rounded-full bg-primaria text-sm font-bold text-branco">{i + 1}</span>
            <Icone size={26} className="mb-2 mt-2 text-primaria" />
            <h3 className="font-bold">{t}</h3>
            <p className="text-sm text-textoSuave">{d}</p>
          </li>
        ))}
      </ol>
      <h2 className="mb-4 text-2xl font-extrabold text-primaria">Indicadores</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {indicadores.map((i) => (
          <div key={i.t} className="rounded-[12px] border-l-4 border-primaria bg-branco p-5 shadow-leve">
            <h3 className="font-bold">{i.t}</h3>
            <p className="text-textoSuave">{i.d}</p>
          </div>
        ))}
      </div>
    </Pagina>
  );
}
