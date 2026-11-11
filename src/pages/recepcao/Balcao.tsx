import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiClipboard, FiHash, FiMapPin, FiPhone, FiPhoneCall, FiRotateCcw } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { ResumoOrientacao } from "@/components/ResumoOrientacao";
import { useSimulador } from "@/context/SimuladorContext";
import { listarUnidades } from "@/services/api";
import type { OrientacaoBalcao } from "@/services/balcao";
import { upaMaisProxima } from "@/services/orientacao";
import type { Unidade } from "@/types";
import { BalcaoCodigo } from "./BalcaoCodigo";
import { BalcaoQuestionario } from "./BalcaoQuestionario";

type Etapa =
  | { tipo: "INICIO" }
  | { tipo: "CODIGO" }
  | { tipo: "QUESTIONARIO" }
  | { tipo: "ENCAMINHAR"; dados: OrientacaoBalcao }
  | { tipo: "SEGUIR"; dados: OrientacaoBalcao };

function UpaIndicada({ nrCep }: { nrCep: string }) {
  const [upa, setUpa] = useState<Unidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setUpa(upaMaisProxima(await listarUnidades("UPA"), nrCep));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as UPAs.");
    } finally {
      setCarregando(false);
    }
  }, [nrCep]);
  useEffect(() => { void carregar(); }, [carregar]);

  if (carregando) return <Carregando texto="Buscando a UPA mais próxima..." />;
  if (erro) return <MensagemErro mensagem={erro} onTentarNovamente={carregar} />;
  if (!upa) return <EstadoVazio mensagem="Nenhuma UPA encontrada." />;
  return (
    <section className="rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
      <h3 className="text-lg font-extrabold">{upa.nmUnidade}</h3>
      <p className="flex items-start gap-2 text-textoSuave"><FiMapPin className="mt-1 shrink-0" />{upa.dsEndereco} · CEP {upa.nrCep}</p>
      <a href={`tel:${upa.nrTelefone.replace(/\D/g, "")}`} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
        <FiPhone /> {upa.nrTelefone}
      </a>
    </section>
  );
}

/** Vermelho, laranja ou amarelo: mostra o destino e não segue para o agendamento. */
function Encaminhamento({ dados, nrCep }: { dados: OrientacaoBalcao; nrCep: string }) {
  const { orientacao, sinais } = dados;
  const ligar = <a href="tel:192" className="btn bg-gravidade-vermelho text-branco"><FiPhoneCall /> Ligar para o 192</a>;
  return (
    <div className="flex flex-col gap-4">
      <ResumoOrientacao orientacao={orientacao} />
      {orientacao.flElevadaModelo && (
        <p className="flex items-start gap-2 rounded-[12px] bg-mentaSuave p-3 font-semibold">
          <FiAlertCircle className="mt-1 shrink-0" /> A verificação adicional indicou atenção.
        </p>
      )}
      {sinais.length > 0 && (
        <div>
          <h3 className="font-bold">Sinais marcados</h3>
          <ul className="list-disc pl-6">{sinais.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      {orientacao.dsCor === "VERMELHO" && <><h2 className="text-xl font-extrabold">Acione o SAMU 192 agora</h2>{ligar}</>}
      {orientacao.dsCor === "LARANJA" && (
        <>
          <h2 className="text-xl font-extrabold">Encaminhe a um pronto-socorro agora</h2>
          <p>Se não houver como chegar com segurança, ou se piorar, acione o SAMU 192.</p>
          {ligar}
        </>
      )}
      {orientacao.dsCor === "AMARELO" && (
        <>
          <h2 className="text-xl font-extrabold">Encaminhe para a UPA</h2>
          <UpaIndicada nrCep={nrCep} />
          <p className="font-bold">Se piorar, acione o SAMU 192.</p>
        </>
      )}
      <p className="text-sm text-textoSuave">Este atendimento não segue para o agendamento na UBS.</p>
    </div>
  );
}

export function Balcao() {
  const { estado } = useSimulador();
  const cdUnidade = estado.cdUnidadeRecepcao;
  const unidade = estado.unidades.find((u) => u.cdUnidade === cdUnidade);
  const nrCep = unidade?.nrCep ?? "";
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "INICIO" });

  // Trocar a UBS no cabeçalho começa um novo atendimento.
  useEffect(() => setEtapa({ tipo: "INICIO" }), [cdUnidade]);

  const concluir = useCallback((dados: OrientacaoBalcao) => {
    const ubs = dados.orientacao.dsCor === "VERDE" || dados.orientacao.dsCor === "AZUL";
    setEtapa({ tipo: ubs ? "SEGUIR" : "ENCAMINHAR", dados });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-primaria">Balcão — {unidade?.nmUnidade}</h1>

      {etapa.tipo === "INICIO" && (
        <div className="grid gap-3">
          <button onClick={() => setEtapa({ tipo: "CODIGO" })} className="btn min-h-16 bg-primaria text-lg text-branco hover:bg-primariaEscura">
            <FiHash /> Tem código
          </button>
          <button onClick={() => setEtapa({ tipo: "QUESTIONARIO" })} className="btn min-h-16 border-2 border-primaria bg-branco text-lg text-primaria">
            <FiClipboard /> Fazer a orientação aqui
          </button>
          <p className="text-sm text-textoSuave">Para agendar sem orientação, use "Agendar para quem chegou" na Agenda.</p>
        </div>
      )}

      {etapa.tipo === "CODIGO" && <BalcaoCodigo onSeguir={concluir} onFazerAqui={() => setEtapa({ tipo: "QUESTIONARIO" })} />}
      {etapa.tipo === "QUESTIONARIO" && <BalcaoQuestionario nrCep={nrCep} onConcluir={concluir} />}
      {etapa.tipo === "ENCAMINHAR" && <Encaminhamento dados={etapa.dados} nrCep={nrCep} />}
      {etapa.tipo === "SEGUIR" && (
        <>
          <ResumoOrientacao orientacao={etapa.dados.orientacao} />
          {/* Substituído no passo 6: CNS, cadastro de balcão e agendamento/lista do dia. */}
          <p className="rounded-[12px] bg-mentaSuave p-3 font-semibold text-primaria">Orientação pronta para o agendamento.</p>
        </>
      )}

      {etapa.tipo !== "INICIO" && (
        <button onClick={() => setEtapa({ tipo: "INICIO" })} className="btn border border-borda bg-branco text-texto">
          <FiRotateCcw /> Novo atendimento
        </button>
      )}
    </div>
  );
}
