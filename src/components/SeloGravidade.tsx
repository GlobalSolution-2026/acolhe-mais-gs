import { CORES } from "@/data/cores";
import type { Cor } from "@/types/orientacao";

/**
 * Selo da cor de gravidade: número do nível num círculo branco + nome com o destino.
 * Acessibilidade (WCAG 1.4.1): a cor nunca aparece sozinha; o leitor de tela lê "Nível X:" antes do nome.
 */
export function SeloGravidade({ cor }: { cor: Cor }) {
  const c = CORES[cor];
  return (
    <div className={`flex items-center justify-center gap-3 rounded-[12px] px-4 py-3 text-xl font-extrabold shadow-leve ${c.classe}`}>
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-branco text-base text-texto">
        {c.nrNivel}
      </span>
      <span className="sr-only">Nível {c.nrNivel}:</span>
      {/* O nome fica sozinho num span: os testes do Balcão procuram o texto exato com getByText. */}
      <span>{c.nmSelo}</span>
    </div>
  );
}
