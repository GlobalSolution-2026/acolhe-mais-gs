import type { Cor } from "@/types/orientacao";

const ESTILO: Record<Cor, { classe: string; nome: string }> = {
  VERMELHO: { classe: "bg-gravidade-vermelho text-branco", nome: "Vermelho – SAMU" },
  LARANJA: { classe: "bg-gravidade-laranja text-branco", nome: "Laranja – Pronto-socorro" },
  AMARELO: { classe: "bg-gravidade-amarelo text-texto", nome: "Amarelo – UPA" },
  VERDE: { classe: "bg-gravidade-verde text-branco", nome: "Verde – UBS" },
  AZUL: { classe: "bg-gravidade-azul text-branco", nome: "Azul – UBS" },
};

export function SeloGravidade({ cor }: { cor: Cor }) {
  const e = ESTILO[cor];
  return (
    <div className={`rounded-[12px] px-4 py-3 text-center text-xl font-extrabold shadow-leve ${e.classe}`}>{e.nome}</div>
  );
}
