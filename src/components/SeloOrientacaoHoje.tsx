import { FiClipboard } from "react-icons/fi";
import { queixas } from "@/data/queixas";
import type { Cor, Orientacao } from "@/types/orientacao";

const NOME_COR: Record<Cor, string> = { VERMELHO: "vermelho", LARANJA: "laranja", AMARELO: "amarelo", VERDE: "verde", AZUL: "azul" };

/** Recepção: lembrete para quem vai atender de que a pessoa procurou ajuda hoje (queixa e cor da orientação). */
export function SeloOrientacaoHoje({ orientacao }: { orientacao: Orientacao }) {
  const queixa = queixas.find((q) => q.cdQueixa === orientacao.cdQueixa)?.nmQueixa ?? "queixa";
  return (
    <span className="inline-flex items-center gap-1 self-start rounded-full bg-mentaSuave px-2 py-0.5 text-xs font-bold text-primaria">
      <FiClipboard aria-hidden /> Fez orientação hoje: {queixa}, {NOME_COR[orientacao.dsCor]}
    </span>
  );
}
