import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiCalendar, FiExternalLink, FiHash, FiMapPin, FiPhone, FiPhoneCall } from "react-icons/fi";
import { Carregando } from "@/components/Carregando";
import { EstadoVazio } from "@/components/EstadoVazio";
import { MensagemErro } from "@/components/MensagemErro";
import { SeloGravidade } from "@/components/SeloGravidade";
import { useSimulador } from "@/context/SimuladorContext";
import { obterQueixa } from "@/data/queixas";
import { orientacoesUbs } from "@/data/orientacoesUbs";
import { listarUnidades } from "@/services/api";
import { enderecoParaLigacao } from "@/services/cep";
import { respostasEfetivas } from "@/services/fichaOrientacao";
import { concluirOrientacao, ordenarUbsPorCep, upaMaisProxima } from "@/services/orientacao";
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
        <p><strong>Endereço:</strong> {enderecoParaLigacao(atual.nrCep, atual)}</p>
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

/** Código para apresentar na recepção (vale só hoje; funciona sem login) + UBS indicada pelo CEP. */
function CodigoParaUbs({ atual, cdOrientacao }: { atual: OrientacaoEmAndamento; cdOrientacao: number }) {
  const [ubs, setUbs] = useState<Unidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setUbs(ordenarUbsPorCep(await listarUnidades("UBS"), atual.nrCep)[0] ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as UBS.");
    } finally {
      setCarregando(false);
    }
  }, [atual.nrCep]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <section className="flex flex-col gap-3 rounded-[12px] border-2 border-primaria bg-branco p-4" aria-live="polite">
      <h2 className="text-lg font-extrabold text-primaria">Mostre este código na recepção</h2>
      <p className="flex items-center gap-2 text-4xl font-extrabold tracking-wider">
        <FiHash aria-hidden /> <span aria-label={`Código ${cdOrientacao}`}>{cdOrientacao}</span>
      </p>
      <p className="text-base text-textoSuave">O código vale só para hoje. Leve o Cartão SUS.</p>
      {carregando && <Carregando texto="Buscando a UBS indicada..." />}
      {erro && <MensagemErro mensagem={erro} onTentarNovamente={carregar} />}
      {!carregando && !erro && !ubs && <EstadoVazio mensagem="Nenhuma UBS encontrada." />}
      {!carregando && ubs && (
        <div>
          <h3 className="font-extrabold">UBS indicada: {ubs.nmUnidade}</h3>
          <p className="flex items-start gap-2 text-textoSuave"><FiMapPin className="mt-1 shrink-0" />{ubs.dsEndereco} · CEP {ubs.nrCep}</p>
          <a href={`tel:${ubs.nrTelefone.replace(/\D/g, "")}`} className="flex min-h-12 items-center gap-2 font-bold text-primaria">
            <FiPhone /> {ubs.nrTelefone}
          </a>
        </div>
      )}
    </section>
  );
}

function Ubs({ atual, res }: { atual: OrientacaoEmAndamento; res: ResultadoFinal }) {
  const o = orientacoesUbs[atual.cdQueixa];
  const [prefereUbs, setPrefereUbs] = useState(false);
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
      {prefereUbs ? (
        <CodigoParaUbs atual={atual} cdOrientacao={res.cdOrientacao} />
      ) : (
        <button onClick={() => setPrefereUbs(true)} className="btn border border-borda bg-branco text-primaria">
          <FiMapPin /> Prefiro ir à UBS
        </button>
      )}
    </>
  );
}

export function Resultado() {
  const { estado, definirResultado } = useSimulador();
  const { orientacaoAtual: atual, cidadaos, cdCidadaoAtual, fichas } = estado;
  const [erro, setErro] = useState<string | null>(null);
  const rodando = useRef(false);
  // Mesmas respostas efetivas da tela de Orientação (digitadas + cadastro/ficha).
  const respostas = useMemo(
    () => respostasEfetivas({ orientacaoAtual: atual, cidadaos, cdCidadaoAtual, fichas }, new Date())?.respostas,
    [atual, cidadaos, cdCidadaoAtual, fichas],
  );

  const concluir = useCallback(async () => {
    if (!atual || !respostas || atual.resultado || rodando.current) return;
    rodando.current = true;
    setErro(null);
    try {
      definirResultado(await concluirOrientacao(atual.cdQueixa, respostas));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir a orientação.");
    } finally {
      rodando.current = false;
    }
  }, [atual, respostas, definirResultado]);

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
          <h1 className="text-2xl font-extrabold">Vá ao pronto-socorro de um hospital público ou que atenda pelo SUS</h1>
          <ListaSinais sinais={res.sinaisMarcados} />
          <a href="https://buscasaude.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer"
            className="btn border border-borda bg-branco text-primaria">
            <FiExternalLink aria-hidden /> Ver prontos-socorros no Busca Saúde
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <p className="rounded-[12px] bg-mentaSuave p-4 font-extrabold text-primaria">
            Se não tiver como chegar com segurança, ou se piorar no caminho, ligue 192
          </p>
          <a href="tel:192" className="btn bg-primaria text-branco hover:bg-primariaEscura">
            <FiPhoneCall /> Ligar para o 192
          </a>
        </>
      )}
      {res.dsCor === "AMARELO" && <Amarelo atual={atual} res={res} />}
      {(res.dsCor === "VERDE" || res.dsCor === "AZUL") && <Ubs atual={atual} res={res} />}
      <p className="text-sm text-textoSuave">
        O Acolhe+ orienta, mas não faz diagnóstico nem substitui a avaliação de profissionais de saúde.
      </p>
      <Link to="/cidadao/inicio" className="btn border border-borda bg-branco text-primaria">Voltar ao início</Link>
    </div>
  );
}
