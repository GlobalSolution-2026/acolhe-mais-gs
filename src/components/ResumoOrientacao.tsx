import { SeloGravidade } from "@/components/SeloGravidade";
import { queixas } from "@/data/queixas";
import { fmtDiaHora } from "@/lib/datas";
import type { Orientacao } from "@/types/orientacao";

/** Queixa, cor e data de uma orientação salva (balcão). */
export function ResumoOrientacao({ orientacao }: { orientacao: Orientacao }) {
  const queixa = queixas.find((q) => q.cdQueixa === orientacao.cdQueixa);
  return (
    <section className="flex flex-col gap-2 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <SeloGravidade cor={orientacao.dsCor} />
      <p><strong>Código:</strong> {orientacao.cdOrientacao}</p>
      <p><strong>Queixa:</strong> {queixa?.nmQueixa ?? "—"}</p>
      <p><strong>Data:</strong> {fmtDiaHora(orientacao.dtOrientacao)}</p>
    </section>
  );
}
