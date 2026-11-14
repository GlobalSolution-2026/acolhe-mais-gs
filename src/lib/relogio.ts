/**
 * Relógio único do protótipo. DEMONSTRAÇÃO: se hoje não for dia útil e a simulação estiver ligada,
 * agora() devolve o próximo dia útil no mesmo horário, para a lista do dia, a agenda e as ofertas
 * funcionarem na apresentação em qualquer dia. Regras e telas usam agora(), nunca new Date().
 */
import { isDiaUtil, proximoDiaUtil } from "./datas";

const CHAVE = "acolhe-plus:simular-dia-util";
let simular = true;

/** Lê a preferência salva (chamado pelo Provider ao montar, para não divergir do SSR). */
export function carregarPreferenciaSimulacao(): void {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo !== null) simular = salvo === "1";
  } catch {
    /* armazenamento indisponível */
  }
}

export function simulacaoDiaUtilLigada(): boolean {
  return simular;
}

export function definirSimulacaoDiaUtil(ligada: boolean, salvar = true): void {
  simular = ligada;
  if (!salvar) return;
  try {
    localStorage.setItem(CHAVE, ligada ? "1" : "0");
  } catch {
    /* armazenamento indisponível */
  }
}

/** Dia útil simulado (ex.: sáb. 14/11 → seg. 16/11) ou null quando a data real já vale. */
export function diaSimulado(real: Date = new Date()): Date | null {
  return simular && !isDiaUtil(real) ? proximoDiaUtil(real) : null;
}

/** Agora do app: o real ou, na demonstração em dia não útil, o próximo dia útil no mesmo horário. */
export function agora(): Date {
  const real = new Date();
  return diaSimulado(real) ?? real;
}
