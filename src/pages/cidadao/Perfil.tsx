import { Link } from "@tanstack/react-router";
import { FiEdit2, FiHeart, FiLogOut, FiSmartphone } from "react-icons/fi";
import { ResumoFicha } from "@/components/ResumoFicha";
import { fmtDiaHora } from "@/lib/datas";
import { sair } from "@/services/api";
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
  const ficha = cadastro ? (estado.fichas ?? []).find((f) => f.cdCidadao === cadastro.cdCidadao) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-primaria">Perfil</h1>
      {!cadastro ? (
        <>
          <EstadoVazio mensagem="Entre para agendar consultas e guardar sua ficha de saúde. A orientação funciona sem conta." />
          <Link to="/cidadao/entrar" search={{ horario: 0, oferta: 0, destino: "", ubs: 0 }} className="btn bg-primaria text-branco hover:bg-primariaEscura">Entrar</Link>
          <Link to="/cidadao/criar-conta" search={{ horario: 0, oferta: 0, destino: "", ubs: 0 }} className="btn border border-borda bg-branco text-primaria">Criar conta</Link>
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
          <section className="flex flex-col gap-3 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-primaria"><FiHeart /> Ficha de saúde</h2>
            {ficha ? (
              <>
                <ResumoFicha ficha={ficha} cidadao={cadastro} />
                <p className="text-sm text-textoSuave">Última atualização: {fmtDiaHora(ficha.dtAtualizacao, false)}</p>
              </>
            ) : (
              <p className="text-textoSuave">Opcional. Ajuda quem for socorrer você numa emergência.</p>
            )}
            <Link to="/cidadao/perfil/ficha" className="btn border border-borda bg-branco text-primaria">
              <FiEdit2 /> {ficha ? "Editar" : "Preencher ficha"}
            </Link>
          </section>
          <button onClick={() => void sair()} className="btn border border-borda bg-branco text-texto">
            <FiLogOut /> Sair
          </button>
        </>
      )}
      <ModoDemonstracao />
    </div>
  );
}
