import { FiInbox } from "react-icons/fi";

export function EstadoVazio({ mensagem = "Nada por aqui ainda." }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[12px] bg-mentaSuave p-6 text-center text-textoSuave">
      <FiInbox size={32} className="text-primaria" />
      <p>{mensagem}</p>
    </div>
  );
}
