import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiList } from "react-icons/fi";
import { CardHorario } from "@/components/CardHorario";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { useSimulador } from "@/context/SimuladorContext";
import { chaveDia, fmtDiaLongo } from "@/lib/datas";
import { listarHorarios } from "@/services/api";
import type { Horario } from "@/types";

export function HorariosUbs({ cdUnidade }: { cdUnidade: number }) {
  const { estado, entrarNaListaDoDia } = useSimulador();
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

  useEffect(() => { void carregar(); }, [carregar]);

  const unidade = estado.unidades.find((u) => u.cdUnidade === cdUnidade);
  const livres = useMemo(() => (horarios ?? []).filter((h) => !h.flOcupado), [horarios]);
  const porDia = useMemo(() => {
    const mapa = new Map<string, Horario[]>();
    for (const h of livres) {
      const chave = chaveDia(h.dtHorario);
      mapa.set(chave, [...(mapa.get(chave) ?? []), h]);
    }
    return [...mapa.entries()];
  }, [livres]);

  const entrarNaLista = () => {
    const cor = estado.orientacaoAtual?.resultado?.dsCor === "AZUL" ? "AZUL" : "VERDE";
    entrarNaListaDoDia(cdUnidade, cor);
    void navigate({ to: "/inicio/lista-do-dia" });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">{unidade?.nmUnidade ?? "UBS"}</h1>
      {!horarios && !erro && <Carregando texto="Buscando os horários livres..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {horarios && livres.length === 0 && (
        <>
          <EstadoVazio mensagem="Nenhum horário livre nesta UBS" />
          <button onClick={entrarNaLista} className="btn bg-primaria text-branco hover:bg-primariaEscura">
            <FiList /> Entrar na lista do dia
          </button>
        </>
      )}
      {porDia.map(([dia, lista]) => (
        <section key={dia}>
          <h2 className="mb-2 font-extrabold capitalize">{fmtDiaLongo(lista[0].dtHorario)}</h2>
          <div className="grid grid-cols-3 gap-2">
            {lista.map((h) => (
              <CardHorario key={h.cdHorario} horario={h}
                onSelecionar={(sel) => void navigate({ to: "/inicio/agendar", search: { horario: sel.cdHorario, oferta: 0 } })} />
            ))}
          </div>
        </section>
      ))}
      {horarios && livres.length > 0 && (
        <button onClick={entrarNaLista} className="btn border border-borda bg-branco text-primaria">
          <FiList /> Prefiro entrar na lista do dia
        </button>
      )}
    </div>
  );
}
