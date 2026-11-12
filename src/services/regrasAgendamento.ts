/**
 * Regras de agendamento do Acolhe+ (funções puras, sem React).
 * Prazos vêm de src/data/configuracoes.ts.
 */
import {
  ANTECEDENCIA_MINIMA_LISTA_DIA_MIN,
  ESCALA_DEMO_SEGUNDOS_POR_MIN,
  PRAZO_ACEITAR_OFERTA_MIN,
  CONFIRMACAO_RISCO_ALTO_DIAS_UTEIS,
  CONFIRMACAO_RISCO_BAIXO_DIAS_UTEIS,
  PRAZO_FINAL_CONFIRMACAO_DIAS_UTEIS,
  LIMIAR_RISCO_ALTO,
} from "@/data/configuracoes";
import { chaveDia, subtrairDiasUteis } from "@/lib/datas";
import type { Cidadao, Consulta, EntradaListaDoDia, OfertaVaga, Horario } from "@/types";
import type { Orientacao } from "@/types/orientacao";

/** Contato válido: celular ou telefone de recado preenchido. */
export function temContatoValido(c: Pick<Cidadao, "nrCelular" | "nrContatoRecado">): boolean {
  return Boolean(c.nrCelular.trim() || c.nrContatoRecado.trim());
}

/** Risco de falta pela pontuação do modelo: ALTO quando vlProbFalta >= LIMIAR_RISCO_ALTO. */
export function classificarRiscoFalta(vlProbFalta: number): Consulta["dsRiscoFalta"] {
  return vlProbFalta >= LIMIAR_RISCO_ALTO ? "ALTO" : "BAIXO";
}

/** Prazo final sem a regra de dispensa: 1 dia útil antes da consulta. */
function prazoFinal(dtHorario: string): Date {
  return subtrairDiasUteis(new Date(dtHorario), PRAZO_FINAL_CONFIRMACAO_DIAS_UTEIS);
}

/** Consultas marcadas depois do prazo final (menos de 1 dia útil de antecedência) dispensam confirmação. */
export function dispensadaConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario">): boolean {
  return new Date(c.dtAgendamento) > prazoFinal(c.dtHorario);
}

/** Momento em que o pedido de confirmação é enviado: 2 dias úteis antes (BAIXO) ou 3 com lembrete (ALTO). */
export function inicioPedidoConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario" | "dsRiscoFalta">): Date | null {
  if (dispensadaConfirmacao(c)) return null;
  const dias = c.dsRiscoFalta === "ALTO" ? CONFIRMACAO_RISCO_ALTO_DIAS_UTEIS : CONFIRMACAO_RISCO_BAIXO_DIAS_UTEIS;
  return subtrairDiasUteis(new Date(c.dtHorario), dias);
}

/** Prazo final para confirmar: 1 dia útil antes da consulta. */
export function prazoConfirmacao(c: Pick<Consulta, "dtAgendamento" | "dtHorario">): Date | null {
  if (dispensadaConfirmacao(c)) return null;
  return prazoFinal(c.dtHorario);
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
  /** Pessoas ainda aguardando encaixe na lista do dia (sem contar quem já tem consulta hoje). */
  naoEncaixadas: number;
  /** REALIZADA ÷ (REALIZADA + FALTA) com orientação (null se não há orientações). */
  comparecimentoAposOrientacao: number | null;
}

export function calcularIndicadores(consultas: Consulta[], listaDoDia: EntradaListaDoDia[], agora = new Date()): Indicadores {
  const encerradas = consultas.filter((c) => (c.dsStatus === "REALIZADA" || c.dsStatus === "FALTA") && new Date(c.dtHorario) < agora);
  const faltas = encerradas.filter((c) => c.dsStatus === "FALTA").length;
  const taxaAbsenteismo = encerradas.length > 0 ? faltas / encerradas.length : null;

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

  const comOrientacao = encerradas.filter((c) => c.cdOrientacao !== null);
  const realizadas = comOrientacao.filter((c) => c.dsStatus === "REALIZADA");
  const comparecimentoAposOrientacao = comOrientacao.length > 0 ? realizadas.length / comOrientacao.length : null;

  // Quem já tem consulta hoje será atendido: não conta como não encaixado.
  const hoje = chaveDia(agora.toISOString());
  const naoEncaixadas = ordenarListaDoDia(listaDoDia).filter((e) => !consultaNoDia(consultas, e.cdCidadao, hoje)).length;
  return { taxaAbsenteismo, taxaReaproveitamento, naoEncaixadas, comparecimentoAposOrientacao };
}

/** Consulta ativa (agendada ou confirmada) da pessoa no dia "aaaa-mm-dd"; a mais cedo, se houver mais de uma. */
export function consultaNoDia(consultas: Consulta[], cdCidadao: number | null, dia: string): Consulta | undefined {
  if (cdCidadao === null) return undefined;
  return consultas
    .filter((c) => c.cdCidadao === cdCidadao && (c.dsStatus === "AGENDADA" || c.dsStatus === "CONFIRMADA") && chaveDia(c.dtHorario) === dia)
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario))[0];
}

/** Orientações do dia da pessoa (vinculadas pelo Balcão/app ou pela lista do dia), da mais recente para a mais antiga. */
export function orientacoesDoDia(orientacoes: Orientacao[], listaDoDia: EntradaListaDoDia[], cdCidadao: number | null, dia: string): Orientacao[] {
  if (cdCidadao === null) return [];
  const daLista = new Set(listaDoDia.filter((e) => e.cdCidadao === cdCidadao).map((e) => e.cdOrientacao));
  return orientacoes
    .filter((o) => (o.cdCidadao === cdCidadao || daLista.has(o.cdOrientacao)) && chaveDia(o.dtOrientacao) === dia)
    .sort((a, b) => b.dtOrientacao.localeCompare(a.dtOrientacao));
}

/** A orientação mais recente do dia (selo da Agenda). */
export function orientacaoDoDia(orientacoes: Orientacao[], listaDoDia: EntradaListaDoDia[], cdCidadao: number | null, dia: string): Orientacao | undefined {
  return orientacoesDoDia(orientacoes, listaDoDia, cdCidadao, dia)[0];
}

/** Não repetir destinatários, não devolver a quem perdeu e pular quem já tem consulta no dia da vaga. */
export function escolherDestinatarioOferta(fila: EntradaListaDoDia[], ofertas: OfertaVaga[], horario: Pick<Horario, "cdHorario" | "dtHorario">,
  cdCidadaoQuePerdeu: number | null, consultas: Consulta[]): EntradaListaDoDia | undefined {
  const dia = chaveDia(horario.dtHorario);
  return ordenarListaDoDia(fila).find((e) =>
    (cdCidadaoQuePerdeu === null || e.cdCidadao !== cdCidadaoQuePerdeu) &&
    !consultaNoDia(consultas, e.cdCidadao, dia) &&
    !ofertas.some((o) => o.cdEntrada === e.cdEntrada && (o.status === "PENDENTE" ||
      (o.cdHorario === horario.cdHorario && (o.status === "RECUSADA" || o.status === "EXPIRADA")))));
}

export function horarioOferecivel(h: Horario, ofertas: OfertaVaga[], agora: Date): boolean {
  return !h.flOcupado && new Date(h.dtHorario).getTime() >= agora.getTime() + ANTECEDENCIA_MINIMA_LISTA_DIA_MIN * 60_000 &&
    !ofertas.some((o) => o.cdHorario === h.cdHorario && o.status === "PENDENTE");
}

export function segundosRestantesOferta(oferta: OfertaVaga, agora: Date): number {
  return Math.max(0, Math.ceil((PRAZO_ACEITAR_OFERTA_MIN * ESCALA_DEMO_SEGUNDOS_POR_MIN * 1000 -
    (agora.getTime() - new Date(oferta.dtCriacao).getTime())) / 1000));
}

export function tempoRestanteOferta(oferta: OfertaVaga, agora: Date): string {
  const duracao = PRAZO_ACEITAR_OFERTA_MIN * ESCALA_DEMO_SEGUNDOS_POR_MIN * 1000;
  const msRestantes = Math.max(0, Math.min(duracao, duracao - (agora.getTime() - new Date(oferta.dtCriacao).getTime())));
  const segundosSimulados = Math.ceil(msRestantes * 60 / (ESCALA_DEMO_SEGUNDOS_POR_MIN * 1000));
  return `${String(Math.floor(segundosSimulados / 60)).padStart(2, "0")}:${String(segundosSimulados % 60).padStart(2, "0")}`;
}

export function ofertasDoCidadao(ofertas: OfertaVaga[], fila: EntradaListaDoDia[]): OfertaVaga[] {
  return ofertas.filter((o) => o.status === "PENDENTE" && fila.some((e) => e.cdEntrada === o.cdEntrada && e.flCidadao));
}

/** AGENDADA com prazo de confirmação vencido, sem contato válido e que ainda não aconteceu: não é liberada e segue pendente. */
export function prazoVencidoSemContato(c: Consulta, cidadao: Pick<Cidadao, "nrCelular" | "nrContatoRecado"> | undefined, agora: Date): boolean {
  const prazo = prazoConfirmacao(c);
  return c.dsStatus === "AGENDADA" && prazo !== null && agora > prazo &&
    new Date(c.dtHorario).getTime() > agora.getTime() && !(cidadao && temContatoValido(cidadao));
}

/**
 * Fonte única da lista e do contador de confirmações da recepção.
 * Inclui as de prazo vencido sem contato (primeiro, da consulta mais próxima); depois risco ALTO e prazo mais próximo.
 */
export function listarPendentesConfirmacao(consultas: Consulta[], horarios: Horario[], cidadaos: Cidadao[], cdUnidade: number, agora: Date): Consulta[] {
  const ids = new Set(horarios.filter((h) => h.cdUnidade === cdUnidade).map((h) => h.cdHorario));
  const vencida = (c: Consulta) => prazoVencidoSemContato(c, cidadaos.find((p) => p.cdCidadao === c.cdCidadao), agora);
  return consultas.filter((c) => ids.has(c.cdHorario) && (precisaConfirmar(c, agora) || vencida(c))).sort((a, b) =>
    Number(vencida(b)) - Number(vencida(a)) ||
    (vencida(a) && vencida(b) ? a.dtHorario.localeCompare(b.dtHorario) : 0) ||
    Number(b.dsRiscoFalta === "ALTO") - Number(a.dsRiscoFalta === "ALTO") ||
    (prazoConfirmacao(a)?.getTime() ?? 0) - (prazoConfirmacao(b)?.getTime() ?? 0));
}

/** Pode cancelar: consulta agendada ou confirmada que ainda não aconteceu. */
export function podeCancelar(c: Pick<Consulta, "dsStatus" | "dtHorario">, agora: Date): boolean {
  return (c.dsStatus === "AGENDADA" || c.dsStatus === "CONFIRMADA") && new Date(c.dtHorario).getTime() > agora.getTime();
}

/** Recepção: presença só no dia da consulta; falta só depois do horário. Só para AGENDADA ou CONFIRMADA. */
export function acoesPresenca(c: Pick<Consulta, "dsStatus" | "dtHorario">, agora: Date): { presenca: boolean; falta: boolean } {
  const ativa = c.dsStatus === "AGENDADA" || c.dsStatus === "CONFIRMADA";
  return {
    presenca: ativa && chaveDia(c.dtHorario) === chaveDia(agora.toISOString()),
    falta: ativa && agora.getTime() > new Date(c.dtHorario).getTime(),
  };
}
