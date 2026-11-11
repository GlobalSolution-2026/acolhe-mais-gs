import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiList } from "react-icons/fi";
import { CardHorario } from "@/components/CardHorario";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { useEntrarNaListaDoDia } from "@/hooks/useEntrarNaListaDoDia";
import { chaveDia, listarDiasUnidade, rotuloDia } from "@/lib/datas";
import { listarHorarios } from "@/services/api";
import type { Horario } from "@/types";

export function HorariosUbs({ cdUnidade }: { cdUnidade: number }) {
  const { estado } = useSimulador();
  const entrarNaLista = useEntrarNaListaDoDia();
  const navigate = useNavigate();
  const [horarios, setHorarios] = useState<Horario[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setHorarios(await listarHorarios(cdUnidade));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os horários.");
    }
  }, [cdUnidade]);

  useEffect(() => { void carregar(); }, [carregar, estado.horarios]);

  const unidade = estado.unidades.find((u) => u.cdUnidade === cdUnidade);
  const livres = useMemo(() => (horarios ?? []).filter((h) => !h.flOcupado && new Date(h.dtHorario).getTime() > Date.now() && !estado.horarios.find((atual) => atual.cdHorario === h.cdHorario)?.flOcupado), [horarios, estado.horarios]);
  const porDia = useMemo(() => {
    return listarDiasUnidade(estado.horarios, cdUnidade)
      .map((dia): [string, Horario[]] => [dia, livres.filter((h) => chaveDia(h.dtHorario) === dia)])
      .filter(([, lista]) => lista.length > 0);
  }, [livres, estado.horarios, cdUnidade]);

  const resultado = estado.orientacaoAtual?.resultado;
  const podeEntrarNaLista = resultado?.dsCor === "VERDE" || resultado?.dsCor === "AZUL";
  const aoEntrarNaLista = () => {
    if (!podeEntrarNaLista) return;
    // Mesmo padrão do agendamento: sem login, vai para Entrar e volta para a lista do dia desta UBS.
    if (estado.cdCidadaoAtual === null) {
      void navigate({ to: "/cidadao/entrar", search: { horario: 0, oferta: 0, destino: "lista-do-dia", ubs: cdUnidade } });
      return;
    }
    if (entrarNaLista(cdUnidade)) void navigate({ to: "/cidadao/lista-do-dia" });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">{unidade?.nmUnidade ?? "UBS"}</h1>
      {!horarios && !erro && <Carregando texto="Buscando os horários livres..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {horarios && livres.length === 0 && (
        <>
          <EstadoVazio mensagem="Nenhum horário livre nesta UBS" />
          {podeEntrarNaLista ? (
            <button onClick={aoEntrarNaLista} className="btn bg-primaria text-branco hover:bg-primariaEscura">
              <FiList /> Entrar na lista do dia
            </button>
          ) : (
            <Link to="/cidadao/inicio" className="btn border border-borda bg-branco text-primaria">
              Fazer a orientação para entrar na lista
            </Link>
          )}
        </>
      )}
      {porDia.map(([dia, lista]) => (
        <section key={dia}>
          <h2 className="mb-2 font-extrabold">{rotuloDia(lista[0]?.dtHorario ?? dia, true)}</h2>
          <div className="grid grid-cols-3 gap-2">
            {lista.map((h) => (
              <CardHorario key={h.cdHorario} horario={h}
                onSelecionar={(sel) => void navigate({ to: "/cidadao/agendar", search: { horario: sel.cdHorario, oferta: 0 } })} />
            ))}
          </div>
        </section>
      ))}
      {horarios && livres.length > 0 && (
        <button onClick={aoEntrarNaLista} className="btn border border-borda bg-branco text-primaria">
          <FiList /> Prefiro entrar na lista do dia
        </button>
      )}
    </div>
  );
}
