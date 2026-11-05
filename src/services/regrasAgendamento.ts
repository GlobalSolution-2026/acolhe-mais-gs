/**
 * Regras de agendamento do Acolhe+ (funções puras, sem React).
 * Prazos vêm de src/data/configuracoes.ts.
 */
import {
  CONFIRMACAO_RISCO_ALTO_H,
  CONFIRMACAO_RISCO_BAIXO_H,
  PRAZO_FINAL_CONFIRMACAO_H,
} from "@/data/configuracoes";
import type { Cidadao, Consulta, EntradaListaDoDia } from "@/types";

const HORA_MS = 3_600_000;

/** Contato válido: celular ou telefone de recado preenchido. */
export function temContatoValido(c: Pick<Cidadao, "nrCelular" | "nrContatoRecado">): boolean {
  return Boolean(c.nrCelular.trim() || c.nrContatoRecado.trim());
}

/** Consultas marcadas com menos de 24 h de antecedência dispensam confirmação. */
export function dispensadaConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario">): boolean {
  return new Date(c.dtHorario).getTime() - new Date(c.dtAgendamento).getTime() < PRAZO_FINAL_CONFIRMACAO_H * HORA_MS;
}

/** Momento em que o pedido de confirmação é enviado: 48 h antes (BAIXO) ou 72 h antes com lembrete (ALTO). */
export function inicioPedidoConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario" | "dsRiscoFalta">): Date | null {
  if (dispensadaConfirmacao(c)) return null;
  const horas = c.dsRiscoFalta === "ALTO" ? CONFIRMACAO_RISCO_ALTO_H : CONFIRMACAO_RISCO_BAIXO_H;
  return new Date(new Date(c.dtHorario).getTime() - horas * HORA_MS);
}

/** Prazo final para confirmar: 24 h antes da consulta. */
export function prazoConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario">): Date | null {
  if (dispensadaConfirmacao(c)) return null;
  return new Date(new Date(c.dtHorario).getTime() - PRAZO_FINAL_CONFIRMACAO_H * HORA_MS);
}

/** A consulta está na janela em que o cidadão precisa confirmar presença. */
export function precisaConfirmar(c: Consulta, agora: Date): boolean {
  if (c.dsStatus !== "AGENDADA") return false;
  const inicio = inicioPedidoConfirmacao(c);
  const prazo = prazoConfirmacao(c);
  if (!inicio || !prazo) return false;
  return agora >= inicio && agora <= prazo;
}

/**
 * Não confirmadas até o prazo final viram LIBERADA.
 * Exceção: paciente sem nenhum contato válido não tem a vaga liberada automaticamente.
 */
export function deveLiberar(c: Consulta, cidadao: Pick<Cidadao, "nrCelular" | "nrContatoRecado"> | undefined, agora: Date): boolean {
  if (c.dsStatus !== "AGENDADA") return false;
  const prazo = prazoConfirmacao(c);
  if (!prazo || agora <= prazo) return false;
  return cidadao ? temContatoValido(cidadao) : false;
}

const PESO_COR = { VERDE: 0, AZUL: 1 } as const;

/**
 * Ordem da lista do dia: quem ficou de um dia para o outro (prioridade) primeiro;
 * depois verde antes de azul; dentro da cor, ordem de chegada.
 */
export function ordenarListaDoDia(entradas: EntradaListaDoDia[]): EntradaListaDoDia[] {
  return [...entradas]
    .filter((e) => e.status === "AGUARDANDO")
    .sort(
      (a, b) =>
        Number(b.flPrioridade) - Number(a.flPrioridade) ||
        PESO_COR[a.dsCor] - PESO_COR[b.dsCor] ||
        new Date(a.dtEntrada).getTime() - new Date(b.dtEntrada).getTime(),
    );
}

/** Posição (1-based) de uma entrada na fila; 0 se não estiver aguardando. */
export function posicaoNaFila(entradas: EntradaListaDoDia[], cdEntrada: number): number {
  const i = ordenarListaDoDia(entradas).findIndex((e) => e.cdEntrada === cdEntrada);
  return i < 0 ? 0 : i + 1;
}

export interface Indicadores {
  /** Faltas ÷ consultas agendadas (null se não há consultas). */
  taxaAbsenteismo: number | null;
  /** Horários liberados e reocupados ÷ horários liberados (null se não há liberações). */
  taxaReaproveitamento: number | null;
  /** Pessoas ainda aguardando encaixe na lista do dia. */
  naoEncaixadas: number;
  /** REALIZADA ÷ consultas vindas de orientação (null se não há orientações). */
  comparecimentoAposOrientacao: number | null;
}

export function calcularIndicadores(consultas: Consulta[], listaDoDia: EntradaListaDoDia[]): Indicadores {
  const faltas = consultas.filter((c) => c.dsStatus === "FALTA").length;
  const taxaAbsenteismo = consultas.length > 0 ? faltas / consultas.length : null;

  const liberadas = consultas.filter((c) => c.dsStatus === "LIBERADA");
  const reocupadas = liberadas.filter((l) =>
    consultas.some(
      (o) =>
        o.cdConsulta !== l.cdConsulta &&
        o.cdHorario === l.cdHorario &&
        o.dsStatus !== "LIBERADA" &&
        new Date(o.dtAgendamento).getTime() > new Date(l.dtAgendamento).getTime(),
    ),
  );
  const taxaReaproveitamento = liberadas.length > 0 ? reocupadas.length / liberadas.length : null;

  const comOrientacao = consultas.filter((c) => c.cdOrientacao !== null);
  const realizadas = comOrientacao.filter((c) => c.dsStatus === "REALIZADA");
  const comparecimentoAposOrientacao = comOrientacao.length > 0 ? realizadas.length / comOrientacao.length : null;

  return { taxaAbsenteismo, taxaReaproveitamento, naoEncaixadas: ordenarListaDoDia(listaDoDia).length, comparecimentoAposOrientacao };
}
