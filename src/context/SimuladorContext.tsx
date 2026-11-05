import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Cidadao, Consulta, EntradaListaDoDia, Horario, OfertaVaga, Unidade } from "@/types";
import type { CodigoQueixa, Orientacao, OrientacaoEmAndamento, Resposta, ResultadoFinal } from "@/types/orientacao";
import { unidadesIniciais } from "@/data/unidades";
import { gerarHorariosIniciais } from "@/data/horarios";
import { gerarSemente } from "@/data/consultasIniciais";
import { conectarStore } from "@/services/api";
import { deveLiberar, ordenarListaDoDia } from "@/services/regrasAgendamento";

export interface EstadoSimulador {
  unidades: Unidade[];
  horarios: Horario[];
  cidadaos: Cidadao[];
  consultas: Consulta[];
  perfil: Perfil;
  cdUnidadeRecepcao: number;
  orientacoes: Orientacao[];
  orientacaoAtual: OrientacaoEmAndamento | null;
  listaDoDia: EntradaListaDoDia[];
  ofertas: OfertaVaga[];
  /** Cadastro do cidadão que usa o app (null até o primeiro agendamento). */
  cdCidadaoAtual: number | null;
}

export type Perfil = "CIDADAO" | "RECEPCAO";

const CHAVE = "acolhe-plus:simulador";

function estadoInicial(): EstadoSimulador {
  const semente = gerarSemente(gerarHorariosIniciais());
  return {
    unidades: unidadesIniciais,
    horarios: semente.horarios,
    cidadaos: semente.cidadaos,
    consultas: semente.consultas,
    perfil: "CIDADAO",
    cdUnidadeRecepcao: 1,
    orientacoes: semente.orientacoes,
    orientacaoAtual: null,
    listaDoDia: [],
    ofertas: [],
    cdCidadaoAtual: null,
  };
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
  definirCidadaoAtual: (cdCidadao: number) => void;
  entrarNaListaDoDia: (cdUnidade: number, dsCor: EntradaListaDoDia["dsCor"]) => void;
  oferecerVaga: (cdHorario: number) => void;
  responderOferta: (cdOferta: number, resposta: "ACEITA" | "RECUSADA" | "EXPIRADA") => void;
  /** DEMONSTRAÇÃO: libera consultas não confirmadas e oferece as vagas à lista do dia. */
  simularPassagemPrazo: () => void;
  /** DEMONSTRAÇÃO: quem não foi encaixado ganha prioridade no próximo dia. */
  encerrarDia: () => void;
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

  const definirCidadaoAtual = useCallback(
    (cdCidadao: number) => atualizarEstado((e) => ({ ...e, cdCidadaoAtual: cdCidadao })),
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
    (cdHorario: number) =>
      atualizarEstado((e) => {
        const horario = e.horarios.find((h) => h.cdHorario === cdHorario);
        if (!horario || horario.flOcupado) return e;
        const fila = ordenarListaDoDia(e.listaDoDia.filter((x) => x.cdUnidade === horario.cdUnidade));
        const primeiro = fila[0];
        if (!primeiro) return e;
        if (e.ofertas.some((o) => o.cdEntrada === primeiro.cdEntrada && o.status === "PENDENTE")) return e;
        const oferta: OfertaVaga = {
          cdOferta: Math.max(0, ...e.ofertas.map((o) => o.cdOferta)) + 1,
          cdHorario,
          cdUnidade: horario.cdUnidade,
          cdEntrada: primeiro.cdEntrada,
          nmCidadao: primeiro.nmCidadao,
          dtCriacao: new Date().toISOString(),
          status: "PENDENTE",
        };
        return { ...e, ofertas: [...e.ofertas, oferta] };
      }),
    [atualizarEstado],
  );

  const responderOferta = useCallback(
    (cdOferta: number, resposta: "ACEITA" | "RECUSADA" | "EXPIRADA") =>
      atualizarEstado((e) => ({
        ...e,
        ofertas: e.ofertas.map((o) => (o.cdOferta === cdOferta ? { ...o, status: resposta } : o)),
        listaDoDia:
          resposta === "ACEITA"
            ? e.listaDoDia.map((x) =>
                x.cdEntrada === e.ofertas.find((o) => o.cdOferta === cdOferta)?.cdEntrada ? { ...x, status: "ENCERRADA" } : x,
              )
            : e.listaDoDia,
      })),
    [atualizarEstado],
  );

  const simularPassagemPrazo = useCallback(
    () =>
      atualizarEstado((e) => {
        // DEMONSTRAÇÃO: simula "agora" 3 dias no futuro para estourar os prazos.
        const agora = new Date(Date.now() + 3 * 86_400_000);
        const liberadas = e.consultas.filter((c) =>
          deveLiberar(c, e.cidadaos.find((x) => x.cdCidadao === c.cdCidadao), agora),
        );
        if (liberadas.length === 0) return e;
        const horariosLiberados = new Set(liberadas.map((c) => c.cdHorario));
        let novo: EstadoSimulador = {
          ...e,
          consultas: e.consultas.map((c) => (horariosLiberados.has(c.cdHorario) ? { ...c, dsStatus: "LIBERADA" as const } : c)),
          horarios: e.horarios.map((h) => (horariosLiberados.has(h.cdHorario) ? { ...h, flOcupado: false } : h)),
        };
        // Oferece cada vaga liberada ao primeiro da lista do dia daquela UBS.
        for (const c of liberadas) {
          const horario = novo.horarios.find((h) => h.cdHorario === c.cdHorario);
          if (!horario) continue;
          const fila = ordenarListaDoDia(novo.listaDoDia.filter((x) => x.cdUnidade === horario.cdUnidade));
          const primeiro = fila[0];
          if (!primeiro) continue;
          if (novo.ofertas.some((o) => o.cdEntrada === primeiro.cdEntrada && o.status === "PENDENTE")) continue;
          novo = {
            ...novo,
            ofertas: [
              ...novo.ofertas,
              {
                cdOferta: Math.max(0, ...novo.ofertas.map((o) => o.cdOferta)) + 1,
                cdHorario: c.cdHorario,
                cdUnidade: horario.cdUnidade,
                cdEntrada: primeiro.cdEntrada,
                nmCidadao: primeiro.nmCidadao,
                dtCriacao: new Date().toISOString(),
                status: "PENDENTE" as const,
              },
            ],
          };
        }
        return novo;
      }),
    [atualizarEstado],
  );

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
        estado, obterEstado, atualizarEstado, reiniciarDemonstracao, trocarPerfil, selecionarUnidadeRecepcao,
        iniciarOrientacao, trocarQueixa, responder, voltarPergunta, definirResultado,
        definirCidadaoAtual, entrarNaListaDoDia, oferecerVaga, responderOferta, simularPassagemPrazo, encerrarDia,
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
