import { FiAlertCircle } from "react-icons/fi";

export function MensagemErro({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[12px] border border-borda bg-branco p-6 text-center" role="alert">
      <FiAlertCircle size={32} className="text-primaria" />
      <p className="font-semibold">{mensagem}</p>
      {onTentarNovamente && (
        <button className="btn bg-primaria text-branco hover:bg-primariaEscura" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
