import type { Horario } from "@/types";
import { unidadesIniciais } from "./unidades";

const HORAS = [8, 9, 10, 11, 14, 15, 16];

/** Gera horários nos próximos 5 dias úteis para cada UBS (alguns já ocupados). */
export function gerarHorariosIniciais(base: Date = new Date()): Horario[] {
  const dias: Date[] = [];
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  while (dias.length < 5) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) dias.push(new Date(d));
  }
  const horarios: Horario[] = [];
  let cd = 1;
  unidadesIniciais
    .filter((u) => u.tpUnidade === "UBS")
    .forEach((u) => {
      dias.forEach((dia, iDia) => {
        HORAS.forEach((h, iHora) => {
          const dt = new Date(dia);
          dt.setHours(h, 0, 0, 0);
          horarios.push({
            cdHorario: cd++,
            cdUnidade: u.cdUnidade,
            dtHorario: dt.toISOString(),
            nrDuracaoMin: 20,
            flOcupado: (iDia + iHora + u.cdUnidade) % 3 === 0,
          });
        });
      });
    });
  return horarios;
}
