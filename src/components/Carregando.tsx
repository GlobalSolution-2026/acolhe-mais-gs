import { FiLoader } from "react-icons/fi";

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-textoSuave" role="status">
      <FiLoader className="animate-spin" size={24} />
      <span>{texto}</span>
    </div>
  );
}
