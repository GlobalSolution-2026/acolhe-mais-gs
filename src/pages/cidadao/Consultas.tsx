import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiCheckCircle, FiMapPin, FiXCircle } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { cancelarConsulta, confirmarConsulta, listarConsultas } from "@/services/api";
import { dispensadaConfirmacao, inicioPedidoConfirmacao, podeCancelar, precisaConfirmar, prazoConfirmacao } from "@/services/regrasAgendamento";
import type { Consulta } from "@/types";

const ROTULO_STATUS: Record<Consulta["dsStatus"], string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  LIBERADA: "Liberada para outra pessoa",
  REALIZADA: "Realizada",
  FALTA: "Falta",
};

function CardConsulta({ consulta, onConfirmar, onCancelar, ocupado }: {
  consulta: Consulta; onConfirmar: (c: Consulta) => void; onCancelar: (c: Consulta) => void; ocupado: boolean;
}) {
  const [cancelando, setCancelando] = useState(false);
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
      {consulta.dsStatus === "AGENDADA" && dispensadaConfirmacao(consulta) && <p className="text-sm">Não precisa confirmar: consulta marcada com menos de 1 dia útil de antecedência.</p>}
      {consulta.dsStatus === "AGENDADA" && inicio && prazo && new Date() < inicio && <p className="text-sm">
        Vamos pedir a confirmação em {fmtDiaHora(inicio.toISOString(), false)}. Você terá até {fmtDiaHora(prazo.toISOString(), false)} para confirmar.
      </p>}
      {precisa && prazo && (
        <>
          <p className="text-sm font-semibold text-gravidade-laranja">
            Confirme sua presença até {fmtDiaHora(prazo.toISOString(), false)}.
          </p>
          <button onClick={() => onConfirmar(consulta)} disabled={ocupado}
            className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
            <FiCheck /> {ocupado ? "Aguarde..." : "Confirmar presença"}
          </button>
        </>
      )}
      {podeCancelar(consulta, new Date()) && (cancelando ? (
        <div className="flex flex-col gap-2 rounded-[12px] border border-borda bg-fundo p-3" role="alert">
          <p className="font-semibold">Tem certeza? O horário será liberado para outra pessoa.</p>
          <button onClick={() => onCancelar(consulta)} disabled={ocupado}
            className="btn bg-gravidade-vermelho text-branco disabled:opacity-60">
            {ocupado ? "Cancelando..." : "Sim, cancelar a consulta"}
          </button>
          <button onClick={() => setCancelando(false)} disabled={ocupado} className="btn border border-borda bg-branco text-texto">Voltar</button>
        </div>
      ) : (
        <button onClick={() => setCancelando(true)} disabled={ocupado} className="btn border border-borda bg-branco text-texto">
          <FiXCircle /> Não vou poder ir
        </button>
      ))}
    </article>
  );
}

export function Consultas() {
  const { estado } = useSimulador();
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
    setOcupado(true);
    setSucesso(null);
    try {
      await confirmarConsulta(c.cdConsulta, "APP");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível confirmar.");
    } finally {
      setOcupado(false);
    }
  };

  const cancelar = async (c: Consulta) => {
    setOcupado(true);
    setErro(null);
    setSucesso(null);
    try {
      await cancelarConsulta(c.cdConsulta);
      await carregar();
      setSucesso("Consulta cancelada. Obrigado por avisar: o horário vai para outra pessoa.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível cancelar.");
    } finally {
      setOcupado(false);
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
      {sucesso && (
        <p className="flex items-start gap-2 rounded-[12px] bg-mentaSuave p-3 font-semibold text-primaria" role="status">
          <FiCheckCircle className="mt-1 shrink-0" /> {sucesso}
        </p>
      )}
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
          {proximas.map((c) => <CardConsulta key={c.cdConsulta} consulta={c} onConfirmar={(x) => void confirmar(x)} onCancelar={(x) => void cancelar(x)} ocupado={ocupado} />)}
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-extrabold">Anteriores</h2>
          {anteriores.map((c) => <CardConsulta key={c.cdConsulta} consulta={c} onConfirmar={(x) => void confirmar(x)} onCancelar={(x) => void cancelar(x)} ocupado={ocupado} />)}
        </section>
      )}
    </div>
  );
}
