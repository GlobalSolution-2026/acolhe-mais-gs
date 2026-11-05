import { Link } from "@tanstack/react-router";
import { FiAlertTriangle } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { SeloDemonstracao } from "@/components/SeloDemonstracao";
import { useSimulador } from "@/context/SimuladorContext";
import { posicaoNaFila } from "@/services/regrasAgendamento";

export function ListaDoDiaCidadao() {
  const { estado } = useSimulador();
  const minha = estado.listaDoDia.find((e) => e.flCidadao && e.status === "AGUARDANDO");

  if (!minha) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Você não está na lista do dia de nenhuma UBS." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Voltar ao início</Link>
      </div>
    );
  }

  const fila = estado.listaDoDia.filter((e) => e.cdUnidade === minha.cdUnidade);
  const posicao = posicaoNaFila(fila, minha.cdEntrada);
  const unidade = estado.unidades.find((u) => u.cdUnidade === minha.cdUnidade);

  return (
    <div className="flex flex-col gap-4">
      <SeloDemonstracao />
      <h1 className="text-2xl font-extrabold text-primaria">Lista do dia</h1>
      <div className="flex flex-col items-center gap-1 rounded-[12px] border border-borda bg-branco p-6 text-center shadow-leve">
        <p className="text-base text-textoSuave">Sua posição na fila da {unidade?.nmUnidade ?? "UBS"}</p>
        <p className="text-5xl font-extrabold text-primaria">{posicao}º</p>
        {minha.flPrioridade && <p className="font-semibold text-textoSuave">Você tem prioridade por ter ficado de ontem.</p>}
      </div>
      <p className="flex items-start gap-2 rounded-[12px] bg-mentaSuave p-3 font-semibold">
        <FiAlertTriangle className="mt-1 shrink-0" /> Se piorar, ligue 192 ou procure a UPA.
      </p>
      <Link to="/cidadao/avisos" className="btn border border-borda bg-branco text-primaria">Ver meus avisos</Link>
    </div>
  );
}
