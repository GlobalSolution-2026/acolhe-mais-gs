import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { SeloDemonstracao } from "@/components/SeloDemonstracao";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { confirmarConsulta } from "@/services/api";
import { ofertasDoCidadao, tempoRestanteOferta, precisaConfirmar, prazoConfirmacao } from "@/services/regrasAgendamento";
import type { OfertaVaga } from "@/types";

function CardOferta({ oferta }: { oferta: OfertaVaga }) {
  const { estado, responderOferta } = useSimulador();
  const navigate = useNavigate();
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const horario = estado.horarios.find((h) => h.cdHorario === oferta.cdHorario);
  const unidade = estado.unidades.find((u) => u.cdUnidade === oferta.cdUnidade);

  return (
    <article className="flex flex-col gap-2 rounded-[12px] border-2 border-primaria bg-branco p-4 shadow-leve">
      <p className="font-extrabold text-primaria">Vaga liberada na {unidade?.nmUnidade ?? "UBS"}!</p>
      {horario && <p className="font-semibold">{fmtDiaHora(horario.dtHorario)}</p>}
      <p className="font-bold text-gravidade-laranja" role="timer">
        Você tem {tempoRestanteOferta(oferta, agora)} para aceitar.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => void navigate({ to: "/cidadao/agendar", search: { horario: oferta.cdHorario, oferta: oferta.cdOferta } })}
          className="btn bg-primaria text-branco hover:bg-primariaEscura">
          <FiCheck /> Aceitar
        </button>
        <button onClick={() => responderOferta(oferta.cdOferta, "RECUSADA")} className="btn border border-borda bg-branco text-texto">
          <FiX /> Recusar
        </button>
      </div>
    </article>
  );
}

export function Avisos() {
  const { estado } = useSimulador();
  const [confirmando, setConfirmando] = useState(false);
  const agora = new Date();

  const ofertas = ofertasDoCidadao(estado.ofertas, estado.listaDoDia);
  const confirmacoes = estado.consultas.filter(
    (c) => c.cdCidadao === estado.cdCidadaoAtual && precisaConfirmar(c, agora),
  );

  const confirmar = async (cdConsulta: number) => {
    setConfirmando(true);
    try {
      await confirmarConsulta(cdConsulta, "APP");
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Avisos</h1>
      <SeloDemonstracao />
      {ofertas.length === 0 && confirmacoes.length === 0 && (
        <EstadoVazio mensagem="Nenhum aviso no momento." />
      )}
      {ofertas.map((o) => (
        <CardOferta key={o.cdOferta} oferta={o} />
      ))}
      {confirmacoes.map((c) => {
        const prazo = prazoConfirmacao(c);
        return (
          <article key={c.cdConsulta} className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
            <p className="font-extrabold">Confirme sua consulta na {c.nmUnidade}</p>
            <p className="font-semibold">{fmtDiaHora(c.dtHorario)}</p>
            {prazo && <p className="text-sm font-semibold text-gravidade-laranja">Prazo: até {fmtDiaHora(prazo.toISOString())}.</p>}
            <button onClick={() => void confirmar(c.cdConsulta)} disabled={confirmando}
              className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
              <FiCheck /> {confirmando ? "Confirmando..." : "Confirmar presença"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
