import { useState } from "react";
import { FiPhone, FiUserCheck } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { fmtDiaHora } from "@/lib/datas";
import { confirmarConsulta } from "@/services/api";
import { prazoConfirmacao, temContatoValido } from "@/services/regrasAgendamento";
import type { CanalConfirmacao } from "@/types";

export function Pendentes() {
  const { estado } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const pendentes = estado.consultas
    .filter((c) => {
      if (c.dsStatus !== "AGENDADA") return false;
      const h = estado.horarios.find((x) => x.cdHorario === c.cdHorario);
      return h?.cdUnidade === cdUnidade && prazoConfirmacao(c) !== null;
    })
    .sort((a, b) => (prazoConfirmacao(a)?.getTime() ?? 0) - (prazoConfirmacao(b)?.getTime() ?? 0));

  const confirmar = async (cdConsulta: number, canal: CanalConfirmacao) => {
    setEnviando(true);
    setErro(null);
    try {
      await confirmarConsulta(cdConsulta, canal);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível confirmar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Confirmações pendentes</h1>
      {erro && <MensagemErro mensagem={erro} />}
      {pendentes.length === 0 && <EstadoVazio mensagem="Nenhuma consulta aguardando confirmação." />}
      {pendentes.map((c) => {
        const cidadao = estado.cidadaos.find((x) => x.cdCidadao === c.cdCidadao);
        const prazo = prazoConfirmacao(c);
        const semContato = cidadao ? !temContatoValido(cidadao) : true;
        return (
          <article key={c.cdConsulta} className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold">{cidadao?.nmCidadao ?? "Paciente"}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.dsRiscoFalta === "ALTO" ? "bg-gravidade-vermelho text-branco" : "bg-mentaSuave text-primaria"}`}>
                Risco {c.dsRiscoFalta}
              </span>
            </div>
            <p className="font-semibold capitalize">{fmtDiaHora(c.dtHorario)}</p>
            {prazo && <p className="text-sm font-semibold text-gravidade-laranja">Prazo para confirmar: {fmtDiaHora(prazo.toISOString())}</p>}
            {cidadao?.nrCelular && <p className="text-sm">Celular: {cidadao.nrCelular}</p>}
            {cidadao?.nmContatoRecado && (
              <p className="text-sm">Recado: {cidadao.nmContatoRecado} · {cidadao.nrContatoRecado}</p>
            )}
            {semContato && (
              <p className="rounded-[12px] bg-mentaSuave p-2 text-sm font-bold text-primaria">
                Sem contato: a vaga não é liberada automaticamente
              </p>
            )}
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => void confirmar(c.cdConsulta, "TELEFONE")} disabled={enviando}
                className="btn bg-primaria text-branco hover:bg-primariaEscura disabled:opacity-60">
                <FiPhone /> Confirmado por telefone
              </button>
              <button onClick={() => void confirmar(c.cdConsulta, "PRESENCIAL")} disabled={enviando}
                className="btn border border-borda bg-branco text-primaria disabled:opacity-60">
                <FiUserCheck /> Confirmado presencialmente
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
