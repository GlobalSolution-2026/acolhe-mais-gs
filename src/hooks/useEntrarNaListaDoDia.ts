import { useCallback } from "react";
import { useSimulador } from "@/context/SimuladorContext";

/**
 * Coloca o cidadão logado na lista do dia da UBS com a cor e o código da orientação em andamento (VERDE/AZUL).
 * Usado na tela de horários e na volta do login/criação de conta; lê o estado mais recente na hora.
 */
export function useEntrarNaListaDoDia() {
  const { obterEstado, entrarNaListaDoDia } = useSimulador();
  return useCallback((cdUnidade: number): boolean => {
    const resultado = obterEstado().orientacaoAtual?.resultado;
    if (!cdUnidade || (resultado?.dsCor !== "VERDE" && resultado?.dsCor !== "AZUL")) return false;
    entrarNaListaDoDia(cdUnidade, resultado.dsCor, resultado.cdOrientacao);
    return true;
  }, [obterEstado, entrarNaListaDoDia]);
}
