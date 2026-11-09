import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiClock, FiRotateCcw, FiRepeat, FiSunset } from "react-icons/fi";
import type { ResumoSimulacao } from "@/services/simulacao";
import { useSimulador } from "@/context/SimuladorContext";
import { CONTA_DEMO } from "@/data/contaDemo";

export function ModoDemonstracao({ onConcluir }: { onConcluir?: () => void }) {
  const { reiniciarDemonstracao, simularPassagemPrazo, vencerPrazoOfertas, encerrarDia } = useSimulador();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [resumo, setResumo] = useState<ResumoSimulacao | null>(null);
  const [diaEncerrado, setDiaEncerrado] = useState(false);
  const { pathname } = useLocation();
  const cidadao = !pathname.startsWith("/recepcao");

  const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

  const trocar = () => {
    if (cidadao) {
      void navigate({ to: "/recepcao/agenda" });
    } else {
      void navigate({ to: "/cidadao/inicio" });
    }
    onConcluir?.();
  };

  const reiniciar = () => {
    reiniciarDemonstracao();
    setConfirmando(false);
    setResumo(null);
    setDiaEncerrado(false);
    void navigate({ to: "/cidadao/inicio" });
    onConcluir?.();
  };

  return (
    <section className="rounded-[12px] border-2 border-dashed border-primaria/40 bg-mentaSuave p-4">
      <h2 className="text-lg font-extrabold text-primaria">Modo demonstração</h2>
      <p className="mb-4 text-base text-textoSuave">
        Esta área existe só para a apresentação. Ela não faz parte do app real.
      </p>
      <div className="flex flex-col gap-3">
        {cidadao && (
          <div className="rounded-[12px] border border-borda bg-branco p-3">
            <p className="font-semibold">Cidadão de exemplo (com ficha de saúde)</p>
            <p>Cartão SUS: <strong className="select-all">{CONTA_DEMO.nrCns}</strong></p>
            <p>Senha: <strong className="select-all">{CONTA_DEMO.dsSenha}</strong></p>
          </div>
        )}
        <button onClick={trocar} className="btn bg-primaria text-branco hover:bg-primariaEscura">
          <FiRepeat /> {cidadao ? "Ver como a UBS vê" : "Voltar para o cidadão"}
        </button>

        {!cidadao && (
          <>
            <div>
              <button
                onClick={() => { setResumo(simularPassagemPrazo()); }}
                className="btn w-full border border-borda bg-branco text-primaria"
              >
                <FiClock /> Simular passagem do prazo
              </button>
              <p className="mt-1 text-sm text-textoSuave">
                Libera as consultas não confirmadas da UBS selecionada nos próximos 3 dias com atendimento (dias que têm horários), mais as do cidadão do app em qualquer data. Consultas marcadas com menos de 1 dia útil de antecedência e pacientes sem contato são mantidos.
                {resumo && <strong className="mt-2 block text-primaria" role="status">
                  {resumo.consultasLiberadas + resumo.mantidasSemContato === 0 ? "Nenhuma consulta não confirmada no período." : `${plural(resumo.consultasLiberadas, "consulta liberada", "consultas liberadas")} · ${plural(resumo.vagasOferecidas, "vaga oferecida", "vagas oferecidas")} à lista do dia · ${plural(resumo.vagasDeVoltaNaAgenda, "vaga voltou", "vagas voltaram")} para a agenda · ${plural(resumo.mantidasSemContato, "consulta mantida (paciente sem contato)", "consultas mantidas (pacientes sem contato)")}`}
                </strong>}
              </p>
            </div>
            <button onClick={vencerPrazoOfertas} className="btn border border-borda bg-branco text-primaria">
              <FiClock /> Vencer prazo das ofertas agora
            </button>
            <div>
              <button
                onClick={() => { encerrarDia(); setDiaEncerrado(true); }}
                className="btn w-full border border-borda bg-branco text-primaria"
              >
                <FiSunset /> Encerrar o dia
              </button>
              <p className="mt-1 text-sm text-textoSuave">
                Quem não foi encaixado ganha prioridade no próximo horário livre e recebe o aviso "Se piorar, ligue 192
                ou procure a UPA".
                {diaEncerrado && <strong className="block text-primaria">Dia encerrado: a fila ganhou prioridade.</strong>}
              </p>
            </div>
          </>
        )}

        {confirmando ? (
          <div className="rounded-[12px] border border-borda bg-branco p-3" role="alertdialog" aria-label="Confirmar reinício">
            <p className="mb-3 font-semibold">Apagar tudo e voltar ao início da demonstração?</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmando(false)} className="btn border border-borda bg-branco text-texto">
                Cancelar
              </button>
              <button onClick={reiniciar} className="btn bg-primaria text-branco hover:bg-primariaEscura">
                Sim, reiniciar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmando(true)} className="btn border border-borda bg-branco text-primaria">
            <FiRotateCcw /> Reiniciar demonstração
          </button>
        )}
      </div>
    </section>
  );
}
