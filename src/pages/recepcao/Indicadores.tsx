import { useSimulador } from "@/context/SimuladorContext";
import { calcularIndicadores } from "@/services/regrasAgendamento";

function Card({ titulo, valor, explicacao }: { titulo: string; valor: string; explicacao: string }) {
  return (
    <article className="flex flex-col gap-1 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <p className="text-sm font-semibold text-textoSuave">{titulo}</p>
      <p className="text-3xl font-extrabold text-primaria">{valor}</p>
      <p className="text-sm text-textoSuave">{explicacao}</p>
    </article>
  );
}

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export function Indicadores() {
  const { estado } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;

  const consultas = estado.consultas.filter((c) =>
    estado.horarios.some((h) => h.cdHorario === c.cdHorario && h.cdUnidade === cdUnidade),
  );
  const lista = estado.listaDoDia.filter((e) => e.cdUnidade === cdUnidade);
  const i = calcularIndicadores(consultas, lista);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Indicadores</h1>
      <Card titulo="Taxa de absenteísmo" valor={pct(i.taxaAbsenteismo)}
        explicacao="Faltas entre as consultas agendadas que já aconteceram." />
      <Card titulo="Taxa de reaproveitamento" valor={pct(i.taxaReaproveitamento)}
        explicacao="Horários liberados que foram ocupados de novo, divididos pelos horários liberados." />
      <Card titulo="Não encaixados hoje" valor={String(i.naoEncaixadas)}
        explicacao="Pessoas ainda aguardando uma vaga na lista do dia." />
      <Card titulo="Comparecimento após orientação" valor={pct(i.comparecimentoAposOrientacao)}
        explicacao="Consultas realizadas entre as que vieram de uma orientação do app." />
    </div>
  );
}
