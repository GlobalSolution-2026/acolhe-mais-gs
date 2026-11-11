import { useState } from "react";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { alternarOpcao, podeContinuar, textoPergunta } from "@/services/regrasOrientacao";
import type { Pergunta, Resposta, Respostas } from "@/types/orientacao";

const BOTAO = "btn w-full border-2 border-borda bg-branco text-lg text-texto hover:border-primaria";

function CampoNumero({ onResponder }: { onResponder: (v: number) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ valor: string }>();
  return (
    <form onSubmit={handleSubmit(({ valor }) => onResponder(Number(valor)))} className="flex flex-col gap-3" noValidate>
      <CampoFormulario id="idade" label="Idade em anos" tipo="number" erro={errors.valor}
        registro={register("valor", {
          required: "Informe a idade.",
          min: { value: 0, message: "Idade inválida." },
          max: { value: 120, message: "Idade inválida." },
          pattern: { value: /^\d+$/, message: "Use só números." },
        })} />
      <button type="submit" className="btn bg-primaria text-branco hover:bg-primariaEscura">Continuar</button>
    </form>
  );
}

export function Multipla({ pergunta, onResponder }: { pergunta: Pergunta; onResponder: (v: string[]) => void }) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const alternar = (v: string) => setMarcados((m) => alternarOpcao(m, v));
  const ok = podeContinuar(pergunta, marcados);
  return (
    <div className="flex flex-col gap-2">
      {pergunta.opcoes?.map((o) => {
        const ativo = marcados.includes(o.valor);
        return (
          <button key={o.valor} onClick={() => alternar(o.valor)} aria-pressed={ativo}
            className={`btn w-full justify-start border-2 text-lg ${ativo ? "border-primaria bg-mentaSuave text-primaria" : "border-borda bg-branco text-texto"}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${ativo ? "border-primaria bg-primaria text-branco" : "border-borda"}`}>
              {ativo && <FiCheck size={16} />}
            </span>
            {o.rotulo}
          </button>
        );
      })}
      {!ok && <p className="text-sm text-textoSuave">Marque pelo menos uma opção.</p>}
      <button onClick={() => onResponder(marcados)} disabled={!ok}
        className="btn mt-2 bg-primaria text-branco hover:bg-primariaEscura disabled:cursor-not-allowed disabled:opacity-50">
        Continuar
      </button>
    </div>
  );
}

export function RespostasPergunta({ pergunta, onResponder }: { pergunta: Pergunta; onResponder: (v: Resposta) => void }) {
  switch (pergunta.tipoResposta) {
    case "NUMERO":
      return <CampoNumero onResponder={onResponder} />;
    case "MULTIPLA":
      return <Multipla pergunta={pergunta} onResponder={onResponder} />;
    case "ESCALA_DOR":
      return (
        <div>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} onClick={() => onResponder(n)} className="btn min-h-14 border-2 border-borda bg-branco px-0 text-xl text-texto hover:border-primaria">
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-base text-textoSuave"><span>0 = sem dor</span><span>10 = pior dor</span></div>
        </div>
      );
    default: {
      const opcoes = pergunta.tipoResposta === "OPCOES"
        ? pergunta.opcoes ?? []
        : [
            { valor: "SIM", rotulo: "Sim" },
            { valor: "NAO", rotulo: "Não" },
            ...(pergunta.tipoResposta === "SIM_NAO_NAOSEI" ? [{ valor: "NAO_SEI", rotulo: "Não sei" }] : []),
          ];
      return (
        <div className="flex flex-col gap-3">
          {opcoes.map((o) => (
            <button key={o.valor} onClick={() => onResponder(o.valor)} className={BOTAO}>{o.rotulo}</button>
          ))}
        </div>
      );
    }
  }
}

/** Barra de progresso + texto da pergunta + respostas (sem estado próprio: usado pelo app e pelo balcão). */
export function PerguntaAtual({ pergunta, progresso, respostas, onResponder }: {
  pergunta: Pergunta; progresso: number; respostas: Respostas; onResponder: (codigo: string, v: Resposta) => void;
}) {
  return (
    <>
      <div className="h-3 w-full overflow-hidden rounded-full bg-borda" role="progressbar" aria-valuenow={Math.round(progresso * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primaria transition-all" style={{ width: `${Math.max(4, progresso * 100)}%` }} />
      </div>
      <h1 className="text-2xl font-extrabold leading-snug">{textoPergunta(pergunta, respostas)}</h1>
      <RespostasPergunta key={pergunta.codigo} pergunta={pergunta} onResponder={(v) => onResponder(pergunta.codigo, v)} />
    </>
  );
}

export function BotaoPerguntaAnterior({ onVoltar }: { onVoltar: () => void }) {
  return (
    <button onClick={onVoltar} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
      <FiArrowLeft /> Pergunta anterior
    </button>
  );
}
