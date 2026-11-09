import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Cidadao, Consulta, CredencialCidadao, FichaSaude, EntradaListaDoDia, Horario, OfertaVaga, Unidade } from "@/types";
import type { CodigoQueixa, LocalOrientacao, Orientacao, OrientacaoEmAndamento, Resposta, ResultadoFinal } from "@/types/orientacao";
import { unidadesIniciais } from "@/data/unidades";
import { gerarHorariosIniciais } from "@/data/horarios";
import { gerarSemente } from "@/data/consultasIniciais";
import { conectarStore } from "@/services/api";
import { oferecerHorario, finalizarOferta, simularPrazo, vencerOfertas, type ResumoSimulacao } from "@/services/simulacao";
import { chaveDia } from "@/lib/datas";
import { credenciaisIniciais, fichasIniciais } from "@/data/contaDemo";

export interface EstadoSimulador {
  dtSemente: string;
  versaoSemente?: number;
  unidades: Unidade[];
  horarios: Horario[];
  cidadaos: Cidadao[];
  consultas: Consulta[];
  cdUnidadeRecepcao: number;
  orientacoes: Orientacao[];
  orientacaoAtual: OrientacaoEmAndamento | null;
  listaDoDia: EntradaListaDoDia[];
  ofertas: OfertaVaga[];
  /** Cadastro do cidadão que usa o app logado (null = sem login; mock até a API Java). */
  cdCidadaoAtual: number | null;
  /** Credenciais mock (login por CNS + senha). */
  credenciais?: CredencialCidadao[];
  /** Fichas de saúde opcionais. */
  fichas?: FichaSaude[];
}

const CHAVE = "acolhe-plus:simulador:v2";

function estadoInicial(): EstadoSimulador {
  const agora = new Date();
  const semente = gerarSemente(gerarHorariosIniciais(agora), agora);
  return {
    dtSemente: chaveDia(agora.toISOString()),
    versaoSemente: 3,
    unidades: unidadesIniciais,
    horarios: semente.horarios,
    cidadaos: semente.cidadaos,
    consultas: semente.consultas,
    cdUnidadeRecepcao: 1,
    orientacoes: semente.orientacoes,
    orientacaoAtual: null,
    listaDoDia: semente.listaDoDia,
    ofertas: [],
    cdCidadaoAtual: null,
    credenciais: credenciaisIniciais,
    fichas: fichasIniciais(agora),
  };
}

function lerStorage(): EstadoSimulador | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const { perfil: _perfilAntigo, ...salvo } = JSON.parse(bruto) as Partial<EstadoSimulador> & { perfil?: unknown };
    if (salvo.versaoSemente !== 3|| salvo.dtSemente !== chaveDia(new Date().toISOString())) return null;
    return { ...estadoInicial(), ...salvo };
  } catch {
    return null;
  }
}

function gravarStorage(estado: EstadoSimulador) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* armazenamento indisponível */
  }
}

interface SimuladorValor {
  estado: EstadoSimulador;
  /** Leitura síncrona do estado mais recente (usado pelo serviço). */
  obterEstado: () => EstadoSimulador;
  atualizarEstado: (fn: (atual: EstadoSimulador) => EstadoSimulador) => void;
  reiniciarDemonstracao: () => void;
  selecionarUnidadeRecepcao: (cdUnidade: number) => void;
  iniciarOrientacao: (cdQueixa: CodigoQueixa, nrCep: string, local?: LocalOrientacao) => void;
  trocarQueixa: (cdQueixa: CodigoQueixa) => void;
  responder: (codigo: string, valor: Resposta) => void;
  voltarPergunta: () => void;
  definirResultado: (resultado: ResultadoFinal) => void;
  definirCidadaoAtual: (cdCidadao: number) => void;
  entrarNaListaDoDia: (cdUnidade: number, dsCor: EntradaListaDoDia["dsCor"]) => void;
  oferecerVaga: (cdHorario: number) => void;
  responderOferta: (cdOferta: number, resposta: "ACEITA" | "RECUSADA" | "EXPIRADA") => void;
  /** DEMONSTRAÇÃO: libera consultas não confirmadas e oferece as vagas à lista do dia. */
  simularPassagemPrazo: () => ResumoSimulacao;
  vencerPrazoOfertas: () => void;
  /** DEMONSTRAÇÃO: quem não foi encaixado ganha prioridade no próximo dia. */
  encerrarDia: () => void;
}

// Preserve only the Context identity across module updates, never its state/value.
// An already-mounted Provider and refreshed consumers must use the same object.
const registroContexto = globalThis as typeof globalThis & {
  __acolheSimuladorContext?: ReturnType<typeof createContext<SimuladorValor | null>>;
};
const SimuladorContext = registroContexto.__acolheSimuladorContext ?? createContext<SimuladorValor | null>(null);
registroContexto.__acolheSimuladorContext = SimuladorContext;

export function SimuladorProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSimulador>(estadoInicial);
  const ref = useRef(estado);
  const carregado = useRef(false);

  useEffect(() => {
    const salvo = lerStorage();
    if (salvo) {
      ref.current = salvo;
      setEstado(salvo);
    }
    carregado.current = true;
  }, []);

  useEffect(() => {
    if (carregado.current) gravarStorage(estado);
  }, [estado]);

  const obterEstado = useCallback(() => ref.current, []);

  const atualizarEstado = useCallback((fn: (atual: EstadoSimulador) => EstadoSimulador) => {
    const novo = fn(ref.current);
    ref.current = novo;
    setEstado(novo);
  }, []);

  conectarStore({ obterEstado, atualizarEstado });

  const reiniciarDemonstracao = useCallback(() => {
    const novo = estadoInicial();
    ref.current = novo;
    setEstado(novo);
  }, []);

  const selecionarUnidadeRecepcao = useCallback(
    (cdUnidade: number) => atualizarEstado((e) => ({ ...e, cdUnidadeRecepcao: cdUnidade })),
    [atualizarEstado],
  );

  const alterarOrientacao = useCallback(
    (fn: (o: OrientacaoEmAndamento) => OrientacaoEmAndamento) =>
      atualizarEstado((e) => (e.orientacaoAtual ? { ...e, orientacaoAtual: fn(e.orientacaoAtual) } : e)),
    [atualizarEstado],
  );

  const iniciarOrientacao = useCallback(
    (cdQueixa: CodigoQueixa, nrCep: string, local: LocalOrientacao = {}) =>
      atualizarEstado((e) => ({ ...e, orientacaoAtual: { cdQueixa, nrCep, ...local, respostas: {}, ordem: [], resultado: null } })),
    [atualizarEstado],
  );

  /** Troca a queixa mantendo as respostas do perfil (PF1, PF2, SX, PF3, DOR). */
  const trocarQueixa = useCallback(
    (cdQueixa: CodigoQueixa) =>
      alterarOrientacao((o) => {
        const perfil = ["PF1", "PF2", "SX", "PF3", "DOR"];
        const respostas = Object.fromEntries(Object.entries(o.respostas).filter(([k]) => perfil.includes(k)));
        return { ...o, cdQueixa, respostas, ordem: o.ordem.filter((c) => perfil.includes(c)), resultado: null };
      }),
    [alterarOrientacao],
  );

  const responder = useCallback(
    (codigo: string, valor: Resposta) =>
      alterarOrientacao((o) => ({
        ...o,
        respostas: { ...o.respostas, [codigo]: valor },
        ordem: o.ordem.includes(codigo) ? o.ordem : [...o.ordem, codigo],
      })),
    [alterarOrientacao],
  );

  const voltarPergunta = useCallback(
    () =>
      alterarOrientacao((o) => {
        const ultima = o.ordem[o.ordem.length - 1];
        if (!ultima) return o;
        const { [ultima]: _removida, ...respostas } = o.respostas;
        return { ...o, respostas, ordem: o.ordem.slice(0, -1) };
      }),
    [alterarOrientacao],
  );

  const definirResultado = useCallback(
    (resultado: ResultadoFinal) => alterarOrientacao((o) => ({ ...o, resultado })),
    [alterarOrientacao],
  );

  const definirCidadaoAtual = useCallback(
    (cdCidadao: number) => atualizarEstado((e) => ({ ...e, cdCidadaoAtual: cdCidadao, listaDoDia: e.listaDoDia.map((x) => x.flCidadao ? { ...x, cdCidadao, nmCidadao: e.cidadaos.find((c) => c.cdCidadao === cdCidadao)?.nmCidadao ?? x.nmCidadao } : x) })),
    [atualizarEstado],
  );

  const entrarNaListaDoDia = useCallback(
    (cdUnidade: number, dsCor: EntradaListaDoDia["dsCor"]) =>
      atualizarEstado((e) => {
        if (e.listaDoDia.some((x) => x.flCidadao && x.status === "AGUARDANDO")) return e;
        const nome = e.cidadaos.find((c) => c.cdCidadao === e.cdCidadaoAtual)?.nmCidadao ?? "Você";
        const entrada: EntradaListaDoDia = {
          cdEntrada: Math.max(0, ...e.listaDoDia.map((x) => x.cdEntrada)) + 1,
          cdUnidade,
          cdCidadao: e.cdCidadaoAtual,
          nmCidadao: nome,
          dsCor,
          dtEntrada: new Date().toISOString(),
          flPrioridade: false,
          flCidadao: true,
          status: "AGUARDANDO",
        };
        return { ...e, listaDoDia: [...e.listaDoDia, entrada] };
      }),
    [atualizarEstado],
  );

  const oferecerVaga = useCallback(
    (cdHorario: number) => atualizarEstado((e) => oferecerHorario(e, cdHorario, new Date())),
    [atualizarEstado],
  );

  const responderOferta = useCallback(
    (cdOferta: number, resposta: "ACEITA" | "RECUSADA" | "EXPIRADA") =>
      atualizarEstado((e) => finalizarOferta(e, cdOferta, resposta, new Date())),
    [atualizarEstado],
  );

  const simularPassagemPrazo = useCallback(() => {
    const { novoEstado, resumo } = simularPrazo(ref.current, new Date());
    atualizarEstado(() => novoEstado);
    return resumo;
  }, [atualizarEstado]);

  const vencerPrazoOfertas = useCallback(
    () => atualizarEstado((e) => vencerOfertas(e, new Date(), true)), [atualizarEstado],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const novo = vencerOfertas(ref.current, new Date());
      if (novo !== ref.current) atualizarEstado(() => novo);
    }, 1000);
    return () => clearInterval(timer);
  }, [atualizarEstado]);

  const encerrarDia = useCallback(
    () =>
      atualizarEstado((e) => ({
        ...e,
        listaDoDia: e.listaDoDia.map((x) => (x.status === "AGUARDANDO" ? { ...x, flPrioridade: true } : x)),
      })),
    [atualizarEstado],
  );

  return (
    <SimuladorContext.Provider
      value={{
        estado, obterEstado, atualizarEstado, reiniciarDemonstracao, selecionarUnidadeRecepcao,
        iniciarOrientacao, trocarQueixa, responder, voltarPergunta, definirResultado,
        definirCidadaoAtual, entrarNaListaDoDia, oferecerVaga, responderOferta, simularPassagemPrazo, vencerPrazoOfertas, encerrarDia,
      }}
    >
      {children}
    </SimuladorContext.Provider>
  );
}

export function useSimulador() {
  const ctx = useContext(SimuladorContext);
  if (!ctx) throw new Error("useSimulador deve ser usado dentro de SimuladorProvider");
  return ctx;
}
