import { FiInfo } from "react-icons/fi";

/** Selo da ficha de saúde: prévia da US26 (integração futura com o Meu SUS Digital). */
export function AvisoPrevia({ className = "" }: { className?: string }) {
  return (
    <p
      role="note"
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-primaria/30 bg-mentaSuave px-3 py-1 text-sm font-bold text-primaria ${className}`}
    >
      <FiInfo className="shrink-0" aria-hidden />
      Prévia – integração com o Meu SUS prevista
    </p>
  );
}
