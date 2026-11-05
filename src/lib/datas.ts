import type { Horario } from "@/types";

export const primeiraMaiuscula = (texto: string) => texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);

/** Formatação de datas em pt-BR usada nas telas. */

export function fmtDia(iso: string): string {
  return primeiraMaiuscula(new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }));
}

export function fmtDiaLongo(iso: string): string {
  return primeiraMaiuscula(new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }));
}

export function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDiaHora(iso: string): string {
  return `${fmtDia(iso)} às ${fmtHora(iso)}`;
}

/** Chave de dia (aaaa-mm-dd) para agrupar horários. */
export function chaveDia(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Fonte única dos dias disponíveis de uma unidade. */
export function listarDiasUnidade(horarios: Horario[], cdUnidade: number): string[] {
  return [...new Set(horarios.filter((h) => h.cdUnidade === cdUnidade).map((h) => chaveDia(h.dtHorario)))].sort();
}

export function rotuloDia(iso: string, longo = false, agora = new Date()): string {
  const texto = longo ? fmtDiaLongo(iso) : fmtDia(iso);
  return chaveDia(iso) === chaveDia(agora.toISOString()) ? `Hoje (${texto.charAt(0).toLowerCase() + texto.slice(1)})` : texto;
}
