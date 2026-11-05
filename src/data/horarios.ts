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
  // A janela BAIXO precisa de horários entre +24 h e +48 h, mesmo no fim de semana.
  for (const deslocamento of [1, 2]) {
    const d = new Date(hoje); d.setDate(d.getDate() + deslocamento);
    const naJanela = [8, 9, 10, 11, 14, 15, 16].some((hora) => {
      const t = new Date(d); t.setHours(hora);
      const delta = t.getTime() - base.getTime();
      return delta >= 24 * 3_600_000 && delta <= 48 * 3_600_000;
    });
    if (naJanela && !dias.some((dia) => dia.getTime() === d.getTime())) dias.push(d);
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
