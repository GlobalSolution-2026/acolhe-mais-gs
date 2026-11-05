import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiAlertTriangle, FiArrowLeft, FiCheck } from "react-icons/fi";
import { CampoFormulario } from "@/components/CampoFormulario";
import { EstadoVazio } from "@/components/EstadoVazio";
import { useSimulador } from "@/context/SimuladorContext";
import { obterQueixa } from "@/data/queixas";
import { proximoPasso, textoPergunta } from "@/services/regrasOrientacao";
import type { Pergunta, Resposta } from "@/types/orientacao";

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

function Multipla({ pergunta, onResponder }: { pergunta: Pergunta; onResponder: (v: string[]) => void }) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const alternar = (v: string) => setMarcados((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]));
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
      <button onClick={() => onResponder(marcados)} className="btn mt-2 bg-primaria text-branco hover:bg-primariaEscura">Continuar</button>
    </div>
  );
}

function Respostas({ pergunta, onResponder }: { pergunta: Pergunta; onResponder: (v: Resposta) => void }) {
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

function Encerramento({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <h2 className="text-xl font-extrabold text-primaria">{titulo}</h2>
      {children}
    </div>
  );
}

export function Orientacao() {
  const { estado, responder, voltarPergunta, trocarQueixa } = useSimulador();
  const navigate = useNavigate();
  const atual = estado.orientacaoAtual;
  const passo = atual ? proximoPasso(atual.cdQueixa, atual.respostas) : null;

  useEffect(() => {
    if (passo?.tipo === "RESULTADO") void navigate({ to: "/cidadao/resultado", replace: true });
  }, [passo?.tipo, navigate]);

  if (!atual || !passo) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Nenhuma orientação em andamento." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Escolher o que estou sentindo</Link>
      </div>
    );
  }

  const voltar = atual.ordem.length > 0 && (
    <button onClick={voltarPergunta} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
      <FiArrowLeft /> Pergunta anterior
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-bold text-textoSuave">{obterQueixa(atual.cdQueixa).nmQueixa}</p>

      {passo.tipo === "PERGUNTA" && (
        <>
          <div className="h-3 w-full overflow-hidden rounded-full bg-borda" role="progressbar" aria-valuenow={Math.round(passo.progresso * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primaria transition-all" style={{ width: `${Math.max(4, passo.progresso * 100)}%` }} />
          </div>
          <h1 className="text-2xl font-extrabold leading-snug">{textoPergunta(passo.pergunta, atual.respostas)}</h1>
          <Respostas key={passo.pergunta.codigo} pergunta={passo.pergunta} onResponder={(v) => responder(passo.pergunta.codigo, v)} />
        </>
      )}

      {passo.tipo === "MENOR_IDADE" && (
        <Encerramento titulo="Esta orientação é para adultos">
          <p>Para menores de 18 anos, procure a UBS mais próxima. Em caso de risco, ligue para o SAMU.</p>
          <Link to="/cidadao/emergencia" className="btn bg-gravidade-vermelho text-branco"><FiAlertTriangle /> Emergência</Link>
          <Link to="/cidadao/inicio" className="btn border border-borda bg-branco text-primaria">Voltar ao início</Link>
        </Encerramento>
      )}

      {passo.tipo === "POUCOS_SINTOMAS" && (
        <Encerramento titulo="Pode não ser síndrome gripal">
          <p>Com menos de 2 sintomas, escolha outra queixa ou procure a UBS.</p>
          <Link to="/cidadao/inicio" className="btn bg-primaria text-branco hover:bg-primariaEscura">Escolher outra queixa</Link>
        </Encerramento>
      )}

      {passo.tipo === "SUGERIR_GRIPAL" && (
        <Encerramento titulo="Parece síndrome gripal">
          <p>Dor de garganta com tosse ou coriza é melhor avaliada no fluxo de síndrome gripal.</p>
          <button onClick={() => trocarQueixa("GRIPAL")} className="btn bg-primaria text-branco hover:bg-primariaEscura">
            Ir para síndrome gripal
          </button>
        </Encerramento>
      )}

      {voltar}
    </div>
  );
}
