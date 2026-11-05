import type { Horario } from "@/types";

/** Oito dias úteis anteriores, hoje (inclusive fim de semana) e dez posteriores. */
export function gerarHorariosIniciais(base: Date = new Date()): Horario[] {
  const hoje = new Date(base);
  hoje.setHours(0, 0, 0, 0);
  const dias: Date[] = [hoje];
  for (const [sentido, quantidade] of [[-1, 8], [1, 10]] as const) {
    const d = new Date(hoje);
    let encontrados = 0;
    while (encontrados < quantidade) {
      d.setDate(d.getDate() + sentido);
      if (![0, 6].includes(d.getDay())) { dias.push(new Date(d)); encontrados++; }
    }
  }
  dias.sort((a, b) => a.getTime() - b.getTime());
  const horarios: Horario[] = [];
  for (const cdUnidade of [1, 2, 3]) for (const dia of dias) for (const hora of [8, 9, 10, 11, 14, 15, 16]) {
    const dt = new Date(dia);
    dt.setHours(hora);
    horarios.push({ cdHorario: horarios.length + 1, cdUnidade, dtHorario: dt.toISOString(), nrDuracaoMin: 20, flOcupado: false });
  }
  return horarios;
}
