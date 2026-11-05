import { Link } from "@tanstack/react-router";
import { FiCheckCircle, FiCalendar } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { dispensadaConfirmacao } from "@/services/regrasAgendamento";

export function Sucesso({ cdConsulta }: { cdConsulta: number }) {
  const { estado } = useSimulador();
  const consulta = estado.consultas.find((c) => c.cdConsulta === cdConsulta);

  if (!consulta) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Consulta não encontrada." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Voltar ao início</Link>
      </div>
    );
  }

  const explicacao = dispensadaConfirmacao(consulta)
    ? "Como a consulta é em menos de 24 horas, você não precisa confirmar."
    : consulta.dsRiscoFalta === "ALTO"
      ? "Vamos pedir a confirmação 72 horas antes, com um lembrete adicional. Confirme até 24 horas antes da consulta, senão a vaga é oferecida a outra pessoa."
      : "Vamos pedir a confirmação 48 horas antes. Confirme até 24 horas antes da consulta, senão a vaga é oferecida a outra pessoa.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-[12px] bg-mentaSuave p-6 text-center">
        <FiCheckCircle size={40} className="text-primaria" />
        <h1 className="text-2xl font-extrabold text-primaria">Consulta marcada!</h1>
      </div>
      <section className="rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
        <p className="text-lg font-extrabold">{consulta.nmUnidade}</p>
        <p className="font-semibold">{fmtDiaHora(consulta.dtHorario)}</p>
      </section>
      <p className="rounded-[12px] border border-borda bg-branco p-4">{explicacao}</p>
      <Link to="/cidadao/consultas" className="btn bg-primaria text-branco hover:bg-primariaEscura">
        <FiCalendar /> Ver minhas consultas
      </Link>
    </div>
  );
}
