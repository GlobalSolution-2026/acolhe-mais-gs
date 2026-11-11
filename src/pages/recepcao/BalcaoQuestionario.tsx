import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FiArrowLeft, FiPhoneCall } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { MensagemErro } from "@/components/MensagemErro";
import { BotaoPerguntaAnterior, PerguntaAtual } from "@/components/RespostasPergunta";
import { useSimulador } from "@/context/SimuladorContext";
import { obterQueixa, queixas } from "@/data/queixas";
import type { OrientacaoBalcao } from "@/services/balcao";
import { concluirOrientacao } from "@/services/orientacao";
import {
  iniciarQuestionario, proximoPasso, responderNoQuestionario, trocarQueixaNoQuestionario, voltarNoQuestionario,
} from "@/services/regrasOrientacao";
import type { CodigoQueixa, OrientacaoEmAndamento } from "@/types/orientacao";

function Encerramento({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <h2 className="text-xl font-extrabold text-primaria">{titulo}</h2>
      {children}
    </div>
  );
}

/** Mesmo questionário do app, com estado local: sem ficha de saúde e sem tocar em orientacaoAtual. */
export function BalcaoQuestionario({ nrCep, onConcluir }: { nrCep: string; onConcluir: (d: OrientacaoBalcao) => void }) {
  const { obterEstado } = useSimulador();
  const [atual, setAtual] = useState<OrientacaoEmAndamento | null>(null);
  const [escolhendo, setEscolhendo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const rodando = useRef(false);
  const passo = atual && !escolhendo ? proximoPasso(atual.cdQueixa, atual.respostas) : null;

  /** Primeira escolha inicia; as seguintes trocam a queixa mantendo o perfil. */
  const escolher = (cd: CodigoQueixa) => {
    setAtual((o) => (o ? trocarQueixaNoQuestionario(o, cd) : iniciarQuestionario(cd, nrCep)));
    setEscolhendo(false);
  };

  const concluir = useCallback(async () => {
    if (!atual || rodando.current) return;
    rodando.current = true;
    setErro(null);
    try {
      // Mesmas regras + verificação de IA (só eleva) + salvarOrientacao do app.
      const res = await concluirOrientacao(atual.cdQueixa, atual.respostas);
      const orientacao = obterEstado().orientacoes.find((o) => o.cdOrientacao === res.cdOrientacao);
      if (!orientacao) throw new Error("Não foi possível salvar a orientação.");
      onConcluir({ orientacao, sinais: res.sinaisMarcados });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a orientação.");
      rodando.current = false;
    }
  }, [atual, obterEstado, onConcluir]);

  useEffect(() => { if (passo?.tipo === "RESULTADO") void concluir(); }, [passo?.tipo, concluir]);

  if (escolhendo || !atual || !passo) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">Qual a queixa principal?</h2>
        {atual && <p className="text-sm text-textoSuave">As respostas do perfil (idade, sexo, gestação e dor) são mantidas.</p>}
        {queixas.map((q) => (
          <button key={q.codigo} onClick={() => escolher(q.codigo)}
            className="btn w-full justify-start border-2 border-borda bg-branco text-lg text-texto hover:border-primaria">
            {q.nmQueixa}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-bold text-textoSuave">{obterQueixa(atual.cdQueixa).nmQueixa} · sem ficha de saúde</p>

      {passo.tipo === "PERGUNTA" && (
        <PerguntaAtual pergunta={passo.pergunta} progresso={passo.progresso} respostas={atual.respostas}
          onResponder={(c, v) => setAtual((o) => o && responderNoQuestionario(o, c, v))} />
      )}

      {passo.tipo === "RESULTADO" && (erro
        ? <MensagemErro mensagem={erro} onTentarNovamente={() => void concluir()} />
        : <Carregando texto="Fazendo uma verificação adicional..." />)}

      {passo.tipo === "MENOR_IDADE" && (
        <Encerramento titulo="Orientação só para adultos">
          <p>A orientação do Acolhe+ é só para adultos. Encaminhe para o acolhimento da UBS.</p>
          <p className="font-bold">Em caso de risco, acione o SAMU 192.</p>
          <a href="tel:192" className="btn bg-gravidade-vermelho text-branco"><FiPhoneCall /> Ligar para o 192</a>
        </Encerramento>
      )}

      {passo.tipo === "POUCOS_SINTOMAS" && (
        <Encerramento titulo="Pode não ser síndrome gripal">
          <p>Com menos de 2 sintomas, escolha outra queixa.</p>
          <button onClick={() => setEscolhendo(true)} className="btn bg-primaria text-branco hover:bg-primariaEscura">Escolher outra queixa</button>
        </Encerramento>
      )}

      {passo.tipo === "SUGERIR_GRIPAL" && (
        <Encerramento titulo="Parece síndrome gripal">
          <p>Dor de garganta com tosse ou coriza é melhor avaliada no fluxo de síndrome gripal.</p>
          <button onClick={() => escolher("GRIPAL")} className="btn bg-primaria text-branco hover:bg-primariaEscura">Ir para síndrome gripal</button>
        </Encerramento>
      )}

      {passo.tipo !== "RESULTADO" && (atual.ordem.length > 0
        ? <BotaoPerguntaAnterior onVoltar={() => setAtual((o) => o && voltarNoQuestionario(o))} />
        : (
          <button onClick={() => setEscolhendo(true)} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
            <FiArrowLeft /> Trocar a queixa
          </button>
        ))}
    </div>
  );
}
