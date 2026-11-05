import { useState } from "react";
import { FiSend } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { SeloDemonstracao } from "@/components/SeloDemonstracao";
import { useSimulador } from "@/context/SimuladorContext";
import { ANTECEDENCIA_MINIMA_LISTA_DIA_MIN } from "@/data/configuracoes";
import { fmtHora } from "@/lib/datas";
import { ordenarListaDoDia } from "@/services/regrasAgendamento";

export function ListaDoDia() {
  const { estado, oferecerVaga } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;
  const [ofertada, setOfertada] = useState(false);

  const fila = ordenarListaDoDia(estado.listaDoDia.filter((e) => e.cdUnidade === cdUnidade));

  // Vaga oferecível: horário livre começando daqui a pelo menos 60 minutos.
  const limite = Date.now() + ANTECEDENCIA_MINIMA_LISTA_DIA_MIN * 60_000;
  const vaga = estado.horarios
    .filter((h) => h.cdUnidade === cdUnidade && !h.flOcupado && new Date(h.dtHorario).getTime() >= limite)
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario))[0];

  const oferecer = () => {
    if (!vaga) return;
    oferecerVaga(vaga.cdHorario);
    setOfertada(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <SeloDemonstracao />
      <h1 className="text-2xl font-extrabold text-primaria">Lista do dia</h1>
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
          <button onClick={oferecer} disabled={ofertada}
            className="btn w-full bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
            <FiSend /> {ofertada ? "Vaga oferecida ao 1º da fila" : `Oferecer vaga das ${fmtHora(vaga.dtHorario)} ao 1º da fila`}
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
