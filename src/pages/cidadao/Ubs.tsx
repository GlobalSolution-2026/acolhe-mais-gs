import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CardUnidade } from "@/components/CardUnidade";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { SeloGravidade } from "@/components/SeloGravidade";
import { useSimulador } from "@/context/SimuladorContext";
import { listarUnidades } from "@/services/api";
import { ordenarUbsPorCep } from "@/services/orientacao";
import type { Unidade } from "@/types";

export function Ubs() {
  const { estado } = useSimulador();
  const navigate = useNavigate();
  const [ubs, setUbs] = useState<Unidade[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setUbs(await listarUnidades("UBS"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as UBS.");
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const cep = estado.orientacaoAtual?.nrCep ?? "";
  const ordenadas = useMemo(() => (ubs ? ordenarUbsPorCep(ubs, cep) : []), [ubs, cep]);

  const resultado = estado.orientacaoAtual?.resultado ?? null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">UBS próximas</h1>
      {resultado && (
        <div className="flex flex-col gap-1">
          <p className="text-base text-textoSuave">Resultado da sua orientação:</p>
          <SeloGravidade cor={resultado.dsCor} />
        </div>
      )}
      {!ubs && !erro && <Carregando texto="Buscando as UBS próximas..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {ubs && ordenadas.length === 0 && <EstadoVazio mensagem="Nenhuma UBS encontrada." />}
      {ordenadas.map((u) => (
        <CardUnidade key={u.cdUnidade} unidade={u}
          onClick={() => void navigate({ to: "/cidadao/ubs/$cdUnidade", params: { cdUnidade: String(u.cdUnidade) } })} />
      ))}
    </div>
  );
}
