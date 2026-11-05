/** Prazos e regras de negócio do agendamento (valores oficiais do protótipo). */

/** Antecedência mínima (minutos) para oferecer uma vaga à lista do dia. */
export const ANTECEDENCIA_MINIMA_LISTA_DIA_MIN = 60;

/** Tempo (minutos) que o cidadão tem para aceitar a oferta de vaga. */
export const PRAZO_ACEITAR_OFERTA_MIN = 30;

/** Pedido de confirmação enviado 48 h antes (risco BAIXO). */
export const CONFIRMACAO_RISCO_BAIXO_H = 48;

/** Pedido de confirmação enviado 72 h antes, com lembrete adicional (risco ALTO). */
export const CONFIRMACAO_RISCO_ALTO_H = 72;

/** Prazo final para confirmar: 24 h antes da consulta. */
export const PRAZO_FINAL_CONFIRMACAO_H = 24;

/** Cada minuto simulado dura dez segundos reais. */
export const ESCALA_DEMO_SEGUNDOS_POR_MIN = 10;
