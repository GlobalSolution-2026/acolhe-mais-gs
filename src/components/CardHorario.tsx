import { fmtDia, fmtHora } from "@/lib/datas";
import type { Horario } from "@/types";

export function CardHorario({ horario, selecionado, onSelecionar }: { horario: Horario; selecionado?: boolean; onSelecionar?: (h: Horario) => void }) {
  const dia = fmtDia(horario.dtHorario);
  const hora = fmtHora(horario.dtHorario);
  return (
    <button
      disabled={horario.flOcupado}
      onClick={() => onSelecionar?.(horario)}
      className={`flex min-h-12 flex-col items-center justify-center rounded-[12px] border px-3 py-2 text-sm font-semibold transition ${
        horario.flOcupado
          ? "cursor-not-allowed border-borda bg-fundo text-textoSuave line-through"
          : selecionado
            ? "border-primaria bg-primaria text-branco"
            : "border-borda bg-branco hover:border-primaria"
      }`}
    >
      <span>{dia}</span>
      <span className="text-base">{hora}</span>
    </button>
  );
}
