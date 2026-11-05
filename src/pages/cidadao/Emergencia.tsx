import { FiPhoneCall } from "react-icons/fi";

export function Emergencia() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Emergência</h1>
      <section className="rounded-[12px] border-2 border-gravidade-vermelho bg-branco p-4">
        <h2 className="text-xl font-extrabold">SAMU – 192</h2>
        <p className="mb-3 text-textoSuave">Risco de vida, falta de ar forte, desmaio, dor no peito.</p>
        <a href="tel:192" className="btn w-full bg-gravidade-vermelho text-branco">
          <FiPhoneCall /> Ligar para o 192
        </a>
      </section>
      <section className="rounded-[12px] border border-borda bg-branco p-4">
        <h2 className="text-xl font-extrabold">Disque-Intoxicação</h2>
        <p className="mb-3 text-textoSuave">0800 722 6001 · gratuito, 24 horas. Para intoxicação ou envenenamento.</p>
        <a href="tel:08007226001" className="btn w-full bg-primaria text-branco hover:bg-primariaEscura">
          <FiPhoneCall /> Ligar para 0800 722 6001
        </a>
      </section>
    </div>
  );
}
