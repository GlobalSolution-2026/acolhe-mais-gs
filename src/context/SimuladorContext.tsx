import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Cidadao, Consulta, Horario, Unidade } from "@/types";
import type { CodigoQueixa, Orientacao, OrientacaoEmAndamento, Resposta, ResultadoFinal } from "@/types/orientacao";
import { unidadesIniciais } from "@/data/unidades";
import { gerarHorariosIniciais } from "@/data/horarios";
import { conectarStore } from "@/services/api";

export interface EstadoSimulador {
  unidades: Unidade[];
  horarios: Horario[];
  cidadaos: Cidadao[];
  consultas: Consulta[];
  perfil: Perfil;
  cdUnidadeRecepcao: number;
  orientacoes: Orientacao[];
  orientacaoAtual: OrientacaoEmAndamento | null;
}

export type Perfil = "CIDADAO" | "RECEPCAO";

const CHAVE = "acolhe-plus:simulador";

function estadoInicial(): EstadoSimulador {
  return { unidades: unidadesIniciais, horarios: gerarHorariosIniciais(), cidadaos: [], consultas: [], perfil: "CIDADAO", cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null };
}

function lerStorage(): EstadoSimulador | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? { ...estadoInicial(), ...(JSON.parse(bruto) as Partial<EstadoSimulador>) } : null;
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
  trocarPerfil: (perfil: Perfil) => void;
  selecionarUnidadeRecepcao: (cdUnidade: number) => void;
  iniciarOrientacao: (cdQueixa: CodigoQueixa, nrCep: string) => void;
  trocarQueixa: (cdQueixa: CodigoQueixa) => void;
  responder: (codigo: string, valor: Resposta) => void;
  voltarPergunta: () => void;
  definirResultado: (resultado: ResultadoFinal) => void;
}

const SimuladorContext = createContext<SimuladorValor | null>(null);

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

  const trocarPerfil = useCallback(
    (perfil: Perfil) => atualizarEstado((e) => ({ ...e, perfil })),
    [atualizarEstado],
  );

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
    (cdQueixa: CodigoQueixa, nrCep: string) =>
      atualizarEstado((e) => ({ ...e, orientacaoAtual: { cdQueixa, nrCep, respostas: {}, ordem: [], resultado: null } })),
    [atualizarEstado],
  );

  /** Troca a queixa mantendo as respostas do perfil (PF1, PF2, PF3, DOR). */
  const trocarQueixa = useCallback(
    (cdQueixa: CodigoQueixa) =>
      alterarOrientacao((o) => {
        const perfil = ["PF1", "PF2", "PF3", "DOR"];
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

  return (
    <SimuladorContext.Provider
      value={{
        estado, obterEstado, atualizarEstado, reiniciarDemonstracao, trocarPerfil, selecionarUnidadeRecepcao,
        iniciarOrientacao, trocarQueixa, responder, voltarPergunta, definirResultado,
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
