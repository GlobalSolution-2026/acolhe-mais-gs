import { obterQueixa } from "@/data/queixas";
import type { Unidade } from "@/types";
import type { CodigoQueixa, Respostas, ResultadoFinal } from "@/types/orientacao";
import { salvarOrientacao, verificarUrgencia } from "./api";
import { calcularOrientacao, DESTINO_POR_COR } from "./regrasOrientacao";

/** Aplica as regras, chama a verificação de IA (só eleva) e salva a orientação. */
export async function concluirOrientacao(queixa: CodigoQueixa, respostas: Respostas): Promise<ResultadoFinal> {
  const regras = calcularOrientacao(queixa, respostas);
  const nrDor = typeof respostas["DOR"] === "number" ? respostas["DOR"] : null;
  let { dsCor } = regras;
  let flElevadaModelo = false;

  if (dsCor === "VERDE" || dsCor === "AZUL") {
    const sexo = respostas["SX"] === "M" ? "M" : respostas["SX"] === "F" ? "F" : null;
    const { urgente } = await verificarUrgencia({
      idade: typeof respostas["PF2"] === "number" ? respostas["PF2"] : 0,
      sexo,
      trauma: respostas["C5"] === "SIM",
      nrDor: nrDor ?? 0,
      estadoMentalAlerta: !["P4", "D3", "C3", "U1"].some((c) => respostas[c] === "SIM"),
    });
    if (urgente) {
      dsCor = "AMARELO";
      flElevadaModelo = true;
    }
  }

  const dsDestino = DESTINO_POR_COR[dsCor];
  const salva = await salvarOrientacao({ cdQueixa: obterQueixa(queixa).cdQueixa, dsCor, dsDestino, nrDor, flElevadaModelo });
  return { cdOrientacao: salva.cdOrientacao, dsCor, dsDestino, sinaisMarcados: regras.sinaisMarcados, nrDor, flElevadaModelo };
}

/** UPA de referência: a de CEP mais próximo, comparando os 3 primeiros dígitos. */
export function upaMaisProxima(upas: Unidade[], nrCep: string): Unidade | null {
  const alvo = Number(nrCep.replace(/\D/g, "").slice(0, 3));
  let melhor: Unidade | null = null;
  let menor = Infinity;
  for (const u of upas) {
    const d = Math.abs(Number(u.nrCep.replace(/\D/g, "").slice(0, 3)) - alvo);
    if (d < menor) {
      menor = d;
      melhor = u;
    }
  }
  return melhor;
}
