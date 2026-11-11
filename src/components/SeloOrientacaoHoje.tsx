import { FiClipboard } from "react-icons/fi";
import { queixas } from "@/data/queixas";
import { chaveDia, fmtDia } from "@/lib/datas";
import type { Cor, Orientacao } from "@/types/orientacao";

const NOME_COR: Record<Cor, string> = { VERMELHO: "vermelho", LARANJA: "laranja", AMARELO: "amarelo", VERDE: "verde", AZUL: "azul" };

export const nomeQueixa = (o: Orientacao) => queixas.find((q) => q.cdQueixa === o.cdQueixa)?.nmQueixa ?? "queixa";
export const nomeCor = (o: Orientacao) => NOME_COR[o.dsCor];

/**
 * Recepção: lembrete para quem vai atender de que a pessoa procurou ajuda (queixa e cor da orientação).
 * hoje = "aaaa-mm-dd"; orientação de outro dia (fila com prioridade) mostra a data em vez de "hoje".
 */
export function SeloOrientacaoHoje({ orientacao, hoje }: { orientacao: Orientacao; hoje: string }) {
  const rotulo = chaveDia(orientacao.dtOrientacao) === hoje ? "Fez orientação hoje" : `Orientação da fila (${fmtDia(orientacao.dtOrientacao, false)})`;
  return (
    <span className="inline-flex items-center gap-1 self-start rounded-full bg-mentaSuave px-2 py-0.5 text-xs font-bold text-primaria">
      <FiClipboard aria-hidden /> {rotulo}: {nomeQueixa(orientacao)}, {nomeCor(orientacao)}
    </span>
  );
}
