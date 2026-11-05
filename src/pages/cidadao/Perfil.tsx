import { Link } from "@tanstack/react-router";
import { FiEdit2, FiSmartphone } from "react-icons/fi";
import { EstadoVazio } from "@/components/EstadoVazio";
import { ModoDemonstracao } from "@/components/ModoDemonstracao";
import { useSimulador } from "@/context/SimuladorContext";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <p>
      <span className="block text-sm font-semibold text-textoSuave">{rotulo}</span>
      <span className="font-bold">{valor || "—"}</span>
    </p>
  );
}

export function Perfil() {
  const { estado } = useSimulador();
  const cadastro = estado.cidadaos.find((c) => c.cdCidadao === estado.cdCidadaoAtual);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-primaria">Perfil</h1>
      {!cadastro ? (
        <>
          <EstadoVazio mensagem="Você ainda não tem cadastro. Ele é criado no primeiro agendamento." />
          <Link to="/cidadao/inicio" className="btn bg-primaria text-branco hover:bg-primariaEscura">Iniciar uma orientação</Link>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-3 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
            <Linha rotulo="Nome" valor={cadastro.nmCidadao} />
            <Linha rotulo="Cartão SUS" valor={cadastro.nrCns} />
            <Linha rotulo="Celular" valor={cadastro.nrCelular} />
            <Linha rotulo="Contato de recado" valor={cadastro.nmContatoRecado ? `${cadastro.nmContatoRecado} · ${cadastro.nrContatoRecado}` : ""} />
            <Link to="/cidadao/perfil/editar" className="btn border border-borda bg-branco text-primaria">
              <FiEdit2 /> Editar dados
            </Link>
          </section>
          <p className="flex items-start gap-2 rounded-[12px] bg-mentaSuave p-3 font-semibold">
            <FiSmartphone className="mt-1 shrink-0" />
            Confira seu celular: é por ele que avisamos a confirmação e as vagas.
          </p>
        </>
      )}
      <ModoDemonstracao />
    </div>
  );
}
