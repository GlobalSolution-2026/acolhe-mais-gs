import { useMemo, useState } from "react";
import { FiUserPlus } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { FormularioCidadao } from "@/components/FormularioCidadao";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { chaveDia, fmtHora } from "@/lib/datas";
import { agendarConsulta, cadastrarCidadao, registrarPresenca } from "@/services/api";
import type { CidadaoEntrada, Consulta, Horario } from "@/types";

const ROTULO_STATUS: Record<Consulta["dsStatus"], string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  LIBERADA: "Liberada",
  REALIZADA: "Realizada",
  FALTA: "Falta",
};

export function Agenda() {
  const { estado } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;
  const unidade = estado.unidades.find((u) => u.cdUnidade === cdUnidade);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const dias = useMemo(
    () => [...new Set(estado.horarios.filter((h) => h.cdUnidade === cdUnidade).map((h) => chaveDia(h.dtHorario)))].sort(),
    [estado.horarios, cdUnidade],
  );
  const [dia, setDia] = useState(dias[0] ?? "");

  const horariosDia = useMemo(
    () =>
      estado.horarios
        .filter((h) => h.cdUnidade === cdUnidade && chaveDia(h.dtHorario) === dia)
        .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario)),
    [estado.horarios, cdUnidade, dia],
  );

  const consultaDoHorario = (h: Horario) =>
    estado.consultas.find((c) => c.cdHorario === h.cdHorario && c.dsStatus !== "LIBERADA");
  const nomePaciente = (c: Consulta) =>
    estado.cidadaos.find((x) => x.cdCidadao === c.cdCidadao)?.nmCidadao ?? "Paciente";

  const registrar = async (cdConsulta: number, status: "REALIZADA" | "FALTA") => {
    setErro(null);
    try {
      await registrarPresenca(cdConsulta, status);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };

  const agendarParaQuemChegou = async (cdHorario: number, dados: CidadaoEntrada) => {
    setEnviando(true);
    setErro(null);
    try {
      const cidadao = await cadastrarCidadao(dados);
      await agendarConsulta({ cdHorario, cdCidadao: cidadao.cdCidadao, cdOrientacao: null });
      setFormAberto(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível agendar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Agenda — {unidade?.nmUnidade}</h1>
      <div className="flex flex-col gap-1">
        <label htmlFor="dia" className="font-semibold">Dia</label>
        <select id="dia" value={dia} onChange={(e) => setDia(e.target.value)}
          className="min-h-12 rounded-[12px] border border-borda bg-branco px-4">
          {dias.map((d) => {
            const h = estado.horarios.find((x) => chaveDia(x.dtHorario) === d);
            return <option key={d} value={d}>{h ? new Date(h.dtHorario).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : d}</option>;
          })}
        </select>
      </div>
      {erro && <MensagemErro mensagem={erro} />}
      {horariosDia.length === 0 && <EstadoVazio mensagem="Nenhum horário neste dia." />}
      {horariosDia.map((h) => {
        const consulta = consultaDoHorario(h);
        return (
          <article key={h.cdHorario} className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-extrabold">{fmtHora(h.dtHorario)}</p>
              {consulta ? (
                <span className="rounded-full bg-mentaSuave px-2 py-0.5 text-xs font-bold text-primaria">
                  {ROTULO_STATUS[consulta.dsStatus]}
                </span>
              ) : (
                <span className="rounded-full bg-fundo px-2 py-0.5 text-xs font-bold text-textoSuave">Livre</span>
              )}
            </div>
            {consulta && (
              <>
                <p className="font-bold">{nomePaciente(consulta)}</p>
                <p className={`text-sm font-bold ${consulta.dsRiscoFalta === "ALTO" ? "text-gravidade-vermelho" : "text-textoSuave"}`}>
                  Risco de falta: {consulta.dsRiscoFalta} ({Math.round(consulta.vlProbFalta * 100)}%)
                </p>
                {(consulta.dsStatus === "AGENDADA" || consulta.dsStatus === "CONFIRMADA") && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => void registrar(consulta.cdConsulta, "REALIZADA")}
                      className="btn bg-primaria text-branco hover:bg-primariaEscura">Registrar presença</button>
                    <button onClick={() => void registrar(consulta.cdConsulta, "FALTA")}
                      className="btn border border-borda bg-branco text-texto">Registrar falta</button>
                  </div>
                )}
              </>
            )}
            {!consulta && (
              formAberto === h.cdHorario ? (
                <div className="flex flex-col gap-3 border-t border-borda pt-3">
                  <p className="font-bold">Agendar para quem chegou sem celular</p>
                  <FormularioCidadao
                    nrCep={unidade?.nrCep ?? ""}
                    valoresIniciais={{}}
                    aoEnviar={(d) => void agendarParaQuemChegou(h.cdHorario, d)}
                    textoBotao="Agendar"
                    enviando={enviando}
                  />
                  <button onClick={() => setFormAberto(null)} className="btn border border-borda bg-branco text-texto">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setFormAberto(h.cdHorario)} className="btn border border-borda bg-branco text-primaria">
                  <FiUserPlus /> Agendar para quem chegou
                </button>
              )
            )}
          </article>
        );
      })}
    </div>
  );
}
