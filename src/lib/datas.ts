import type { Horario } from "@/types";

export const primeiraMaiuscula = (texto: string) => texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);

/** Formatação de datas em pt-BR usada nas telas. */

export function fmtDia(iso: string, abreFrase = true): string {
  const texto = new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  return abreFrase ? primeiraMaiuscula(texto) : texto;
}

export function fmtDiaLongo(iso: string): string {
  return primeiraMaiuscula(new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }));
}

export function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDiaHora(iso: string, abreFrase = true): string {
  return `${fmtDia(iso, abreFrase)} às ${fmtHora(iso)}`;
}

/**
 * Idade em anos completos em `hoje`. A data de nascimento ("AAAA-MM-DD") é lida como data local:
 * new Date("AAAA-MM-DD") seria UTC e, no Brasil, anteciparia o aniversário em um dia.
 */
export function idadeEm(dtNascimento: string, hoje: Date): number | null {
  const [a, m, d] = dtNascimento.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  const mesHoje = hoje.getMonth() + 1;
  const fezAniversario = mesHoje > m || (mesHoje === m && hoje.getDate() >= d);
  return hoje.getFullYear() - a - (fezAniversario ? 0 : 1);
}

/** Segunda a sexta. */
export function ehDiaUtil(data: Date): boolean {
  return data.getDay() !== 0 && data.getDay() !== 6;
}

/** Volta N dias úteis a partir da data, mantendo o horário (ex.: seg. 09:00 menos 1 = sex. 09:00). */
export function subtrairDiasUteis(data: Date, quantidade: number): Date {
  const resultado = new Date(data);
  let restantes = quantidade;
  while (restantes > 0) {
    resultado.setDate(resultado.getDate() - 1);
    if (ehDiaUtil(resultado)) restantes--;
  }
  return resultado;
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

/** Inclui hoje se ainda tem horário futuro; conta dias com atendimento, não dias corridos. */
export function proximosDiasAtendimento(horarios: Horario[], cdUnidade: number, agora: Date, quantidade = 3): string[] {
  return listarDiasUnidade(horarios.filter((h) => new Date(h.dtHorario) >= agora), cdUnidade).slice(0, quantidade);
}
