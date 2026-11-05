import { useEffect, useState } from "react";
import { FiSend } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { SeloDemonstracao } from "@/components/SeloDemonstracao";
import { useSimulador } from "@/context/SimuladorContext";
import { MensagemErro } from "@/components/MensagemErro";
import { aceitarOfertaPorTelefone } from "@/services/api";
import { fmtDiaHora, fmtHora } from "@/lib/datas";
import { escolherDestinatarioOferta, horarioOferecivel, ordenarListaDoDia, tempoRestanteOferta } from "@/services/regrasAgendamento";

export function ListaDoDia() {
  const { estado, oferecerVaga, responderOferta } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;
  const [agora, setAgora] = useState(() => new Date());
  const [erro, setErro] = useState<string | null>(null);
  const [aceitando, setAceitando] = useState(false);
  useEffect(() => { const t = setInterval(() => setAgora(new Date()), 1000); return () => clearInterval(t); }, []);
  const ofertas = estado.ofertas.filter((o) => o.cdUnidade === cdUnidade && o.status === "PENDENTE");
  const aceitar = async (id: number) => {
    setAceitando(true); setErro(null);
    try { await aceitarOfertaPorTelefone(id); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível aceitar."); }
    finally { setAceitando(false); }
  };

  const fila = ordenarListaDoDia(estado.listaDoDia.filter((e) => e.cdUnidade === cdUnidade));

  // Vaga oferecível: horário livre começando daqui a pelo menos 60 minutos.
  const vaga = estado.horarios
    .filter((h) => h.cdUnidade === cdUnidade && horarioOferecivel(h, estado.ofertas, agora) &&
      escolherDestinatarioOferta(fila, estado.ofertas, h.cdHorario, [...estado.consultas].reverse().find((c) => c.cdHorario === h.cdHorario && c.dsStatus === "LIBERADA")?.cdCidadao ?? null))
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario))[0];

  const oferecer = () => {
    if (!vaga) return;
    oferecerVaga(vaga.cdHorario);
  };

  return (
    <div className="flex flex-col gap-4">
      <SeloDemonstracao />
      <h1 className="text-2xl font-extrabold text-primaria">Lista do dia</h1>
      {erro && <MensagemErro mensagem={erro} />}
      {ofertas.length > 0 && <section className="flex flex-col gap-3">
        <h2 className="font-extrabold">Ofertas em andamento</h2>
        {ofertas.map((o) => {
          const entrada = estado.listaDoDia.find((e) => e.cdEntrada === o.cdEntrada);
          const h = estado.horarios.find((h) => h.cdHorario === o.cdHorario);
          return <article key={o.cdOferta} className="rounded-[12px] border border-borda bg-branco p-4">
            <p className="font-bold">{o.nmCidadao}</p>
            {h && <p>{fmtDiaHora(h.dtHorario)}</p>}
            <p role="timer">Tempo restante: {tempoRestanteOferta(o, agora)}</p>
            {entrada && !entrada.flCidadao && <div className="mt-3 flex flex-col gap-2">
              <button disabled={aceitando} onClick={() => void aceitar(o.cdOferta)} className="btn bg-primaria text-branco">Aceitou por telefone</button>
              <button disabled={aceitando} onClick={() => responderOferta(o.cdOferta, "RECUSADA")} className="btn border border-borda bg-branco text-texto">Recusou</button>
            </div>}
          </article>;
        })}
      </section>}
      {fila.length === 0 && <EstadoVazio mensagem="Ninguém aguardando encaixe hoje." />}
      {fila.map((e, i) => (
        <article key={e.cdEntrada} className="flex items-center gap-3 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mentaSuave text-lg font-extrabold text-primaria">
            {i + 1}º
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{e.nmCidadao}</p>
            <p className="text-sm text-textoSuave">Entrou às {fmtHora(e.dtEntrada)}{e.flPrioridade ? " · prioridade de ontem" : ""}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${e.dsCor === "VERDE" ? "bg-gravidade-verde text-branco" : "bg-gravidade-azul text-branco"}`}>
            {e.dsCor === "VERDE" ? "Verde" : "Azul"}
          </span>
        </article>
      ))}
      {fila.length > 0 && vaga && (
        <div>
          <button onClick={oferecer}
            className="btn w-full bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
            <FiSend /> {`Oferecer vaga de ${fmtDiaHora(vaga.dtHorario)}`}
          </button>
          <p className="mt-1 text-sm text-textoSuave">O cidadão tem 30 minutos para aceitar no aviso do app.</p>
        </div>
      )}
      {fila.length > 0 && !vaga && (
        <p className="rounded-[12px] bg-mentaSuave p-3 text-sm font-semibold text-textoSuave">
          Nenhum horário livre com antecedência suficiente para oferecer agora.
        </p>
      )}
    </div>
  );
}
