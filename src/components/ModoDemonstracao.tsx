import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiClock, FiRotateCcw, FiRepeat, FiSunset } from "react-icons/fi";
import { useSimulador } from "@/context/SimuladorContext";

export function ModoDemonstracao({ onConcluir }: { onConcluir?: () => void }) {
  const { estado, trocarPerfil, reiniciarDemonstracao, simularPassagemPrazo, encerrarDia } = useSimulador();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [prazoSimulado, setPrazoSimulado] = useState(false);
  const [diaEncerrado, setDiaEncerrado] = useState(false);
  const cidadao = estado.perfil === "CIDADAO";

  const trocar = () => {
    if (cidadao) {
      trocarPerfil("RECEPCAO");
      void navigate({ to: "/recepcao/agenda" });
    } else {
      trocarPerfil("CIDADAO");
      void navigate({ to: "/inicio" });
    }
    onConcluir?.();
  };

  const reiniciar = () => {
    reiniciarDemonstracao();
    setConfirmando(false);
    setPrazoSimulado(false);
    setDiaEncerrado(false);
    void navigate({ to: "/inicio" });
    onConcluir?.();
  };

  return (
    <section className="rounded-[12px] border-2 border-dashed border-primaria/40 bg-mentaSuave p-4">
      <h2 className="text-lg font-extrabold text-primaria">Modo demonstração</h2>
      <p className="mb-4 text-base text-textoSuave">
        Esta área existe só para a apresentação. Ela não faz parte do app real.
      </p>
      <div className="flex flex-col gap-3">
        <button onClick={trocar} className="btn bg-primaria text-branco hover:bg-primariaEscura">
          <FiRepeat /> {cidadao ? "Ver como a UBS vê" : "Voltar para o cidadão"}
        </button>

        {!cidadao && (
          <>
            <div>
              <button
                onClick={() => { simularPassagemPrazo(); setPrazoSimulado(true); }}
                className="btn w-full border border-borda bg-branco text-primaria"
              >
                <FiClock /> Simular passagem do prazo
              </button>
              <p className="mt-1 text-sm text-textoSuave">
                As consultas não confirmadas até 24 h antes viram LIBERADA e a vaga é oferecida ao primeiro da lista do
                dia. Quem não tem nenhum contato válido mantém a consulta.
                {prazoSimulado && <strong className="block text-primaria">Prazo simulado: veja a aba Avisos do cidadão.</strong>}
              </p>
            </div>
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
