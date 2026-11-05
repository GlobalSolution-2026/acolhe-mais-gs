import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CardUnidade } from "@/components/CardUnidade";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { SeloGravidade } from "@/components/SeloGravidade";
import { useSimulador } from "@/context/SimuladorContext";
import { listarUnidades } from "@/services/api";
import type { Unidade } from "@/types";

const prefixo = (cep: string) => cep.replace(/\D/g, "").slice(0, 3);

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
  const ordenadas = useMemo(() => {
    if (!ubs) return [];
    const alvo = prefixo(cep);
    return [...ubs].sort((a, b) => {
      const da = prefixo(a.nrCep) === alvo ? 0 : 1;
      const db = prefixo(b.nrCep) === alvo ? 0 : 1;
      if (da !== db) return da - db;
      return Math.abs(Number(prefixo(a.nrCep)) - Number(alvo)) - Math.abs(Number(prefixo(b.nrCep)) - Number(alvo));
    });
  }, [ubs, cep]);

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
          onClick={() => void navigate({ to: "/inicio/ubs/$cdUnidade", params: { cdUnidade: String(u.cdUnidade) } })} />
      ))}
    </div>
  );
}
