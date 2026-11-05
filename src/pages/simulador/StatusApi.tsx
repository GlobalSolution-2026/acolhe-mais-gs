import { useCallback, useEffect, useState } from "react";
import { getStatus } from "@/services/api";
import { Carregando } from "@/components/Carregando";
import { MensagemErro } from "@/components/MensagemErro";
import { EmConstrucao } from "./Simulador";

export function StatusApi() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof getStatus>> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await getStatus());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="flex flex-col gap-4">
      {carregando && <Carregando texto="Verificando a API..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {dados && !carregando && (
        <div className="rounded-[12px] bg-mentaSuave p-4 font-semibold text-primaria">
          Status: {dados.status} · Modo: {dados.modo === "mock" ? "dados de demonstração" : dados.url}
        </div>
      )}
      <EmConstrucao titulo="Status da API" />
    </div>
  );
}
