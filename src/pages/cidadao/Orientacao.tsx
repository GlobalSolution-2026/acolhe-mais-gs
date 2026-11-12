import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import { AvisoPrevia } from "@/components/AvisoPrevia";
import { EstadoVazio } from "@/components/EstadoVazio";
import { BotaoPerguntaAnterior, PerguntaAtual } from "@/components/RespostasPergunta";
import { useSimulador } from "@/context/SimuladorContext";
import { obterQueixa } from "@/data/queixas";
import { respostasEfetivas, textoAvisoFicha, usouFicha } from "@/services/fichaOrientacao";
import { proximoPasso } from "@/services/regrasOrientacao";

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
  // Respostas digitadas + as que vêm do cadastro e da ficha (só quando a orientação é PARA_MIM).
  const efetivas = respostasEfetivas(estado, new Date());
  const passo = atual && efetivas ? proximoPasso(atual.cdQueixa, efetivas.respostas) : null;

  useEffect(() => {
    if (passo?.tipo === "RESULTADO") void navigate({ to: "/cidadao/resultado", replace: true });
  }, [passo?.tipo, navigate]);

  if (!atual || !efetivas || !passo) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Nenhuma orientação em andamento." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Escolher o que estou sentindo</Link>
      </div>
    );
  }

  const voltar = atual.ordem.length > 0 && <BotaoPerguntaAnterior onVoltar={voltarPergunta} />;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-base font-bold text-textoSuave">{obterQueixa(atual.cdQueixa).nmQueixa}</p>
      {efetivas.usados.length > 0 && (
        <div className="-mt-3 flex flex-col gap-1">
          <p className="flex items-start gap-2 text-sm text-textoSuave">
            <FiInfo className="mt-0.5 shrink-0" aria-hidden /> {textoAvisoFicha(efetivas.usados)}
          </p>
          {usouFicha(efetivas.usados) && <AvisoPrevia />}
        </div>
      )}

      {passo.tipo === "PERGUNTA" && (
        <PerguntaAtual pergunta={passo.pergunta} progresso={passo.progresso} respostas={efetivas.respostas} onResponder={responder} />
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
