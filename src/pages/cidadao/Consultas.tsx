import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiMapPin } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { confirmarConsulta, listarConsultas } from "@/services/api";
import { dispensadaConfirmacao, inicioPedidoConfirmacao, precisaConfirmar, prazoConfirmacao } from "@/services/regrasAgendamento";
import type { Consulta } from "@/types";

const ROTULO_STATUS: Record<Consulta["dsStatus"], string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  LIBERADA: "Liberada para outra pessoa",
  REALIZADA: "Realizada",
  FALTA: "Falta",
};

function CardConsulta({ consulta, onConfirmar, confirmando }: { consulta: Consulta; onConfirmar: (c: Consulta) => void; confirmando: boolean }) {
  const prazo = prazoConfirmacao(consulta);
  const inicio = inicioPedidoConfirmacao(consulta);
  const precisa = precisaConfirmar(consulta, new Date());
  return (
    <article className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-mentaSuave px-2 py-0.5 text-xs font-bold text-primaria">{ROTULO_STATUS[consulta.dsStatus]}</span>
      </div>
      <p className="flex items-center gap-2 font-bold"><FiMapPin className="shrink-0" />{consulta.nmUnidade}</p>
      <p className="font-semibold">{fmtDiaHora(consulta.dtHorario)}</p>
      {consulta.dsStatus === "AGENDADA" && dispensadaConfirmacao(consulta) && <p className="text-sm">Não precisa confirmar: consulta marcada com menos de 24 h.</p>}
      {consulta.dsStatus === "AGENDADA" && inicio && prazo && new Date() < inicio && <p className="text-sm">
        Vamos pedir a confirmação em {fmtDiaHora(inicio.toISOString())}. Você terá até {fmtDiaHora(prazo.toISOString())} para confirmar.
      </p>}
      {precisa && prazo && (
        <>
          <p className="text-sm font-semibold text-gravidade-laranja">
            Confirme sua presença até {fmtDiaHora(prazo.toISOString())}.
          </p>
          <button onClick={() => onConfirmar(consulta)} disabled={confirmando}
            className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
            <FiCheck /> {confirmando ? "Confirmando..." : "Confirmar presença"}
          </button>
        </>
      )}
    </article>
  );
}

export function Consultas() {
  const { estado } = useSimulador();
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const todas = await listarConsultas();
      setConsultas(todas.filter((c) => c.cdCidadao === estado.cdCidadaoAtual));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar suas consultas.");
    }
  }, [estado.cdCidadaoAtual]);

  useEffect(() => { void carregar(); }, [carregar, estado.consultas]);

  const confirmar = async (c: Consulta) => {
    setConfirmando(true);
    try {
      await confirmarConsulta(c.cdConsulta, "APP");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível confirmar.");
    } finally {
      setConfirmando(false);
    }
  };

  if (!consultas && !erro) return <Carregando texto="Buscando suas consultas..." />;
  if (erro && !consultas) return <MensagemErro mensagem={erro} onTentarNovamente={carregar} />;

  const lista = consultas ?? [];
  const proximas = lista
    .filter((c) => c.dsStatus === "AGENDADA" || c.dsStatus === "CONFIRMADA")
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario));
  const anteriores = lista
    .filter((c) => c.dsStatus !== "AGENDADA" && c.dsStatus !== "CONFIRMADA")
    .sort((a, b) => b.dtHorario.localeCompare(a.dtHorario));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Minhas consultas</h1>
      {erro && <MensagemErro mensagem={erro} />}
      {lista.length === 0 && (
        <>
          <EstadoVazio mensagem="Você ainda não tem consultas." />
          <Link to="/cidadao/inicio" className="btn bg-primaria text-branco hover:bg-primariaEscura">Iniciar uma orientação</Link>
        </>
      )}
      {proximas.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold">Próximas</h2>
          {proximas.map((c) => <CardConsulta key={c.cdConsulta} consulta={c} onConfirmar={(x) => void confirmar(x)} confirmando={confirmando} />)}
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold">Anteriores</h2>
          {anteriores.map((c) => <CardConsulta key={c.cdConsulta} consulta={c} onConfirmar={(x) => void confirmar(x)} confirmando={confirmando} />)}
        </section>
      )}
    </div>
  );
}
