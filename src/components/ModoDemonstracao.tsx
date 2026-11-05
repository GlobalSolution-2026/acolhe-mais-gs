import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiRotateCcw, FiRepeat } from "react-icons/fi";
import { useSimulador } from "@/context/SimuladorContext";

export function ModoDemonstracao({ onConcluir }: { onConcluir?: () => void }) {
  const { estado, trocarPerfil, reiniciarDemonstracao } = useSimulador();
  const navigate = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
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
