import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCalendar, FiMapPin, FiPhone, FiPhoneCall } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { SeloGravidade } from "@/components/SeloGravidade";
import { useSimulador } from "@/context/SimuladorContext";
import { obterQueixa } from "@/data/queixas";
import { orientacoesUbs } from "@/data/orientacoesUbs";
import { listarUnidades } from "@/services/api";
import { concluirOrientacao, upaMaisProxima } from "@/services/orientacao";
import type { Unidade } from "@/types";
import type { OrientacaoEmAndamento, ResultadoFinal } from "@/types/orientacao";

function ListaSinais({ sinais }: { sinais: string[] }) {
  if (sinais.length === 0) return null;
  return (
    <div>
      <h3 className="font-bold">Sinais marcados</h3>
      <ul className="list-disc pl-6">{sinais.map((s) => <li key={s}>{s}</li>)}</ul>
    </div>
  );
}

function Vermelho({ atual, res }: { atual: OrientacaoEmAndamento; res: ResultadoFinal }) {
  const [referencia, setReferencia] = useState("");
  return (
    <>
      <h1 className="text-2xl font-extrabold">Ligue agora para o SAMU 192</h1>
      <a href="tel:192" className="btn min-h-14 bg-gravidade-vermelho text-xl text-branco"><FiPhoneCall /> Ligar para o 192</a>
      <section className="flex flex-col gap-3 rounded-[12px] border border-borda bg-branco p-4">
        <h2 className="text-lg font-extrabold text-primaria">O que falar na ligação</h2>
        <p><strong>Endereço:</strong> CEP {atual.nrCep}</p>
        <div className="flex flex-col gap-1">
          <label htmlFor="ref" className="font-semibold">Ponto de referência</label>
          <input id="ref" value={referencia} onChange={(e) => setReferencia(e.target.value.slice(0, 120))}
            placeholder="Ex.: perto da padaria" className="min-h-12 rounded-[12px] border border-borda px-4" />
        </div>
        <p><strong>Queixa:</strong> {obterQueixa(atual.cdQueixa).nmQueixa}</p>
        <ListaSinais sinais={res.sinaisMarcados} />
        <div>
          <h3 className="font-bold">Recomendações</h3>
          <ul className="list-disc pl-6">
            <li>Mantenha a calma.</li>
            <li>Não desligue até o atendente liberar.</li>
            <li>Siga as orientações do médico regulador.</li>
          </ul>
        </div>
      </section>
    </>
  );
}

function Amarelo({ atual, res }: { atual: OrientacaoEmAndamento; res: ResultadoFinal }) {
  const [upa, setUpa] = useState<Unidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setUpa(upaMaisProxima(await listarUnidades("UPA"), atual.nrCep));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as UPAs.");
    } finally {
      setCarregando(false);
    }
  }, [atual.nrCep]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <>
      <h1 className="text-2xl font-extrabold">Procure uma UPA</h1>
      {res.flElevadaModelo && (
        <p className="flex items-start gap-2 rounded-[12px] bg-mentaSuave p-3 font-semibold">
          <FiAlertCircle className="mt-1 shrink-0" /> A verificação adicional indicou atenção: procure a UPA.
        </p>
      )}
      {carregando && <Carregando texto="Buscando a UPA mais próxima..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {!carregando && !erro && !upa && <EstadoVazio mensagem="Nenhuma UPA encontrada." />}
      {!carregando && upa && (
        <section className="rounded-[12px] border border-borda bg-branco p-4 shadow-leve">
          <h2 className="text-lg font-extrabold">{upa.nmUnidade}</h2>
          <p className="flex items-start gap-2 text-textoSuave"><FiMapPin className="mt-1 shrink-0" />{upa.dsEndereco} · CEP {upa.nrCep}</p>
          <a href={`tel:${upa.nrTelefone.replace(/\D/g, "")}`} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
            <FiPhone /> {upa.nrTelefone}
          </a>
        </section>
      )}
      <ListaSinais sinais={res.sinaisMarcados} />
      <p className="font-bold">Se piorar, ligue 192.</p>
    </>
  );
}

function Ubs({ atual }: { atual: OrientacaoEmAndamento }) {
  const o = orientacoesUbs[atual.cdQueixa];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Procure a UBS</h1>
      <section className="rounded-[12px] bg-mentaSuave p-4">
        <h2 className="mb-1 font-extrabold text-primaria">O que fazer até a consulta</h2>
        <ul className="list-disc pl-6">{o.cuidados.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section className="rounded-[12px] border border-borda bg-branco p-4">
        <h2 className="mb-1 font-extrabold text-primaria">Procure a urgência se...</h2>
        <ul className="list-disc pl-6">{o.procureUrgencia.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <Link to="/cidadao/ubs" className="btn bg-primaria text-branco hover:bg-primariaEscura">
        <FiCalendar /> Ver horários nas UBS próximas
      </Link>
    </>
  );
}

export function Resultado() {
  const { estado, definirResultado } = useSimulador();
  const atual = estado.orientacaoAtual;
  const [erro, setErro] = useState<string | null>(null);
  const rodando = useRef(false);

  const concluir = useCallback(async () => {
    if (!atual || atual.resultado || rodando.current) return;
    rodando.current = true;
    setErro(null);
    try {
      definirResultado(await concluirOrientacao(atual.cdQueixa, atual.respostas));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a orientação.");
    } finally {
      rodando.current = false;
    }
  }, [atual, definirResultado]);

  useEffect(() => { void concluir(); }, [concluir]);

  if (!atual) {
    return (
      <div className="flex flex-col gap-4">
        <EstadoVazio mensagem="Nenhuma orientação feita ainda." />
        <Link to="/cidadao/inicio" className="btn bg-primaria text-branco">Voltar ao início</Link>
      </div>
    );
  }
  if (erro) return <MensagemErro mensagem={erro} onTentarNovamente={concluir} />;
  const res = atual.resultado;
  if (!res) return <Carregando texto="Fazendo uma verificação adicional..." />;

  return (
    <div className="flex flex-col gap-4">
      <SeloGravidade cor={res.dsCor} />
      {res.dsCor === "VERMELHO" && <Vermelho atual={atual} res={res} />}
      {res.dsCor === "LARANJA" && (
        <>
          <h1 className="text-2xl font-extrabold">Vá a um pronto-socorro agora</h1>
          <ListaSinais sinais={res.sinaisMarcados} />
        </>
      )}
      {res.dsCor === "AMARELO" && <Amarelo atual={atual} res={res} />}
      {(res.dsCor === "VERDE" || res.dsCor === "AZUL") && <Ubs atual={atual} />}
      <p className="text-sm text-textoSuave">
        O Acolhe+ orienta, mas não faz diagnóstico nem substitui a avaliação de profissionais de saúde.
      </p>
      <Link to="/cidadao/inicio" className="btn border border-borda bg-branco text-primaria">Voltar ao início</Link>
    </div>
  );
}
