/** Regras do atendimento no balcão (funções puras, sem React). */
import { chaveDia } from "@/lib/datas";
import type { Consulta, Horario, OfertaVaga } from "@/types";
import type { Orientacao } from "@/types/orientacao";

export type AvaliacaoCodigo =
  | { tipo: "INEXISTENTE" }
  | { tipo: "VENCIDA"; orientacao: Orientacao }
  | { tipo: "JA_UTILIZADA"; orientacao: Orientacao }
  | { tipo: "ENCAMINHAR"; orientacao: Orientacao }
  | { tipo: "OK"; orientacao: Orientacao };

/** Vincular só se ainda não tem dono ou se é o mesmo cidadão. */
export const podeVincular = (o: Pick<Orientacao, "cdCidadao">, cdCidadao: number): boolean =>
  o.cdCidadao == null || o.cdCidadao === cdCidadao;

/**
 * Código digitado na recepção: precisa existir, ser do mesmo dia e não ter consulta.
 * Vínculo com outra pessoa só é conferido depois do CNS (podeVincular).
 */
export function avaliarCodigo(cd: number, orientacoes: Orientacao[], consultas: Consulta[], agora: Date): AvaliacaoCodigo {
  const orientacao = orientacoes.find((o) => o.cdOrientacao === cd);
  if (!orientacao) return { tipo: "INEXISTENTE" };
  if (chaveDia(orientacao.dtOrientacao) !== chaveDia(agora.toISOString())) return { tipo: "VENCIDA", orientacao };
  if (consultas.some((c) => c.cdOrientacao === cd)) return { tipo: "JA_UTILIZADA", orientacao };
  if (orientacao.dsCor !== "VERDE" && orientacao.dsCor !== "AZUL") return { tipo: "ENCAMINHAR", orientacao };
  return { tipo: "OK", orientacao };
}

/** Horários futuros livres da UBS, sem oferta pendente, do mais próximo ao mais distante. */
export function horariosLivresBalcao(horarios: Horario[], ofertas: OfertaVaga[], cdUnidade: number, agora: Date): Horario[] {
  return horarios
    .filter((h) => h.cdUnidade === cdUnidade && !h.flOcupado && new Date(h.dtHorario).getTime() > agora.getTime() &&
      !ofertas.some((o) => o.cdHorario === h.cdHorario && o.status === "PENDENTE"))
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario));
}
