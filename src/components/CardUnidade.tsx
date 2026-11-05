import { FiMapPin, FiPhone } from "react-icons/fi";
import type { Unidade } from "@/types";

export function CardUnidade({ unidade, onClick }: { unidade: Unidade; onClick?: () => void }) {
  return (
    <article className="rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-mentaSuave px-2 py-0.5 text-xs font-bold text-primaria">{unidade.tpUnidade}</span>
        <h3 className="font-bold">{unidade.nmUnidade}</h3>
      </div>
      <p className="flex items-start gap-2 text-sm text-textoSuave"><FiMapPin className="mt-0.5 shrink-0" />{unidade.dsEndereco} · CEP {unidade.nrCep}</p>
      <p className="flex items-center gap-2 text-sm text-textoSuave"><FiPhone />{unidade.nrTelefone}</p>
      {onClick && (
        <button className="btn mt-3 w-full bg-primaria text-branco hover:bg-primariaEscura" onClick={onClick}>Ver horários</button>
      )}
    </article>
  );
}
