import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Cidadao, Consulta, Horario, Unidade } from "@/types";
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
}

export type Perfil = "CIDADAO" | "RECEPCAO";

const CHAVE = "acolhe-plus:simulador";

function estadoInicial(): EstadoSimulador {
  return { unidades: unidadesIniciais, horarios: gerarHorariosIniciais(), cidadaos: [], consultas: [], perfil: "CIDADAO", cdUnidadeRecepcao: 1 };
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

  return (
    <SimuladorContext.Provider
      value={{ estado, obterEstado, atualizarEstado, reiniciarDemonstracao, trocarPerfil, selecionarUnidadeRecepcao }}
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
