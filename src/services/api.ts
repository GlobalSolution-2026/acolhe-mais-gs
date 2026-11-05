/**
 * Camada de serviços do Acolhe+.
 * Cada função tem o nome e formato de um endpoint REST da futura API Java.
 * No protótipo, lê/altera o estado mockado do Context e espera 400 ms.
 */
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { CanalConfirmacao, Cidadao, CidadaoEntrada, Consulta, ErroResponse, Horario, Unidade } from "@/types";
import type { Orientacao, VerificacaoUrgenciaEntrada } from "@/types/orientacao";
import { temContatoValido } from "./regrasAgendamento";

export const API_URL = import.meta.env["VITE_API_URL"] as string | undefined;

type Store = {
  obterEstado: () => EstadoSimulador;
  atualizarEstado: (fn: (atual: EstadoSimulador) => EstadoSimulador) => void;
};

let store: Store | null = null;
/** Conecta o serviço ao estado do Context (chamado pelo hook useApi). */
export function conectarStore(s: Store) {
  store = s;
}

const esperar = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

function falhar(erro: ErroResponse): never {
  throw new Error(erro.erro);
}

function getStore(): Store {
  if (!store) falhar({ status: 500, erro: "Serviço indisponível." });
  return store;
}

// GET /unidades?tipo=UBS
export async function listarUnidades(tipo?: Unidade["tpUnidade"]): Promise<Unidade[]> {
  // const res = await fetch(`${API_URL}/unidades${tipo ? `?tipo=${tipo}` : ""}`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const { unidades } = getStore().obterEstado();
  return tipo ? unidades.filter((u) => u.tpUnidade === tipo) : unidades;
}

// GET /unidades/{cdUnidade}/horarios
export async function listarHorarios(cdUnidade: number): Promise<Horario[]> {
  // const res = await fetch(`${API_URL}/unidades/${cdUnidade}/horarios`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const { unidades, horarios } = getStore().obterEstado();
  if (!unidades.some((u) => u.cdUnidade === cdUnidade)) falhar({ status: 404, erro: "Unidade não encontrada." });
  return horarios.filter((h) => h.cdUnidade === cdUnidade);
}

// POST /cidadaos
export async function cadastrarCidadao(dados: CidadaoEntrada): Promise<Cidadao> {
  // const res = await fetch(`${API_URL}/cidadaos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  if (s.obterEstado().cidadaos.some((c) => c.nrCns === dados.nrCns)) falhar({ status: 409, erro: "Já existe cadastro com este CNS." });
  let novo!: Cidadao;
  s.atualizarEstado((e) => {
    novo = { ...dados, cdCidadao: Math.max(0, ...e.cidadaos.map((c) => c.cdCidadao)) + 1 };
    return { ...e, cidadaos: [...e.cidadaos, novo] };
  });
  return novo;
}

// PUT /cidadaos/{cdCidadao}
export async function atualizarCidadao(cdCidadao: number, dados: CidadaoEntrada): Promise<Cidadao> {
  // const res = await fetch(`${API_URL}/cidadaos/${cdCidadao}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  if (!s.obterEstado().cidadaos.some((c) => c.cdCidadao === cdCidadao)) falhar({ status: 404, erro: "Cadastro não encontrado." });
  const atualizado: Cidadao = { ...dados, cdCidadao };
  s.atualizarEstado((e) => ({
    ...e,
    cidadaos: e.cidadaos.map((c) => (c.cdCidadao === cdCidadao ? atualizado : c)),
  }));
  return atualizado;
}

// GET /consultas
export async function listarConsultas(): Promise<Consulta[]> {
  // const res = await fetch(`${API_URL}/consultas`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  return getStore().obterEstado().consultas;
}

/** API Flask do modelo de IA. */
export const FLASK_URL = import.meta.env["VITE_FLASK_URL"] as string | undefined;

export interface PrevisaoFaltaEntrada {
  idade: number;
  sexo: "F" | "M";
  antecedenciaDias: number;
  diaSemana: number;
  smsRecebido: boolean;
}

// POST /prever-falta (API Flask)
export async function preverFalta(dados: PrevisaoFaltaEntrada): Promise<{ dsRiscoFalta: "BAIXO" | "ALTO"; vlProbFalta: number }> {
  // const res = await fetch(`${FLASK_URL}/prever-falta`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const alto = dados.antecedenciaDias >= 7;
  const vlProbFalta = alto
    ? 0.5 + Math.round(Math.random() * 45) / 100
    : Math.round(Math.random() * 45) / 100;
  return { dsRiscoFalta: alto ? "ALTO" : "BAIXO", vlProbFalta };
}

// POST /consultas
export async function agendarConsulta(dados: { cdHorario: number; cdCidadao: number; cdOrientacao: number | null }): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  const e = s.obterEstado();
  const horario = e.horarios.find((h) => h.cdHorario === dados.cdHorario);
  if (!horario) falhar({ status: 404, erro: "Horário não encontrado." });
  if (horario.flOcupado) falhar({ status: 409, erro: "Este horário acabou de ser ocupado. Escolha outro." });
  const cidadao = e.cidadaos.find((c) => c.cdCidadao === dados.cdCidadao);
  if (!cidadao) falhar({ status: 404, erro: "Cadastro não encontrado." });
  const unidade = e.unidades.find((u) => u.cdUnidade === horario.cdUnidade);

  const antecedenciaDias = Math.max(0, Math.ceil((new Date(horario.dtHorario).getTime() - Date.now()) / 86_400_000));
  const idade = Math.floor((Date.now() - new Date(cidadao.dtNascimento).getTime()) / (365.25 * 86_400_000));
  const previsao = await preverFalta({
    idade,
    sexo: cidadao.dsSexo,
    antecedenciaDias,
    diaSemana: new Date(horario.dtHorario).getDay(),
    smsRecebido: temContatoValido(cidadao),
  });

  const consulta: Consulta = {
    cdConsulta: Math.max(0, ...e.consultas.map((c) => c.cdConsulta)) + 1,
    cdHorario: dados.cdHorario,
    cdCidadao: dados.cdCidadao,
    cdOrientacao: dados.cdOrientacao,
    dtAgendamento: new Date().toISOString(),
    dtConfirmacao: null,
    dsCanalConfirmacao: null,
    dsStatus: "AGENDADA",
    vlProbFalta: previsao.vlProbFalta,
    dsRiscoFalta: previsao.dsRiscoFalta,
    nmUnidade: unidade?.nmUnidade ?? "",
    dtHorario: horario.dtHorario,
  };
  s.atualizarEstado((atual) => ({
    ...atual,
    horarios: atual.horarios.map((h) => (h.cdHorario === dados.cdHorario ? { ...h, flOcupado: true } : h)),
    consultas: [...atual.consultas, consulta],
  }));
  return consulta;
}

// PUT /consultas/{cdConsulta} — confirmar presença
export async function confirmarConsulta(cdConsulta: number, canal: CanalConfirmacao): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dsStatus: "CONFIRMADA", dsCanalConfirmacao: canal }) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  const atual = s.obterEstado().consultas.find((c) => c.cdConsulta === cdConsulta);
  if (!atual) falhar({ status: 404, erro: "Consulta não encontrada." });
  const nova: Consulta = { ...atual, dsStatus: "CONFIRMADA", dtConfirmacao: new Date().toISOString(), dsCanalConfirmacao: canal };
  s.atualizarEstado((e) => ({ ...e, consultas: e.consultas.map((c) => (c.cdConsulta === cdConsulta ? nova : c)) }));
  return nova;
}

// PUT /consultas/{cdConsulta} — registrar presença ou falta
export async function registrarPresenca(cdConsulta: number, status: "REALIZADA" | "FALTA"): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dsStatus: status }) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  const atual = s.obterEstado().consultas.find((c) => c.cdConsulta === cdConsulta);
  if (!atual) falhar({ status: 404, erro: "Consulta não encontrada." });
  const nova: Consulta = { ...atual, dsStatus: status };
  s.atualizarEstado((e) => ({ ...e, consultas: e.consultas.map((c) => (c.cdConsulta === cdConsulta ? nova : c)) }));
  return nova;
}

// GET /status
export async function getStatus(): Promise<{ status: string; modo: "mock" | "api"; url: string | undefined }> {
  // const res = await fetch(`${API_URL}/status`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  return { status: "UP", modo: API_URL ? "api" : "mock", url: API_URL };
}

// POST /orientacoes
export async function postOrientacao(dados: Omit<Orientacao, "cdOrientacao" | "dtOrientacao">): Promise<Orientacao> {
  // const res = await fetch(`${API_URL}/orientacoes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  let nova!: Orientacao;
  getStore().atualizarEstado((e) => {
    nova = { ...dados, cdOrientacao: Math.max(0, ...e.orientacoes.map((o) => o.cdOrientacao)) + 1, dtOrientacao: new Date().toISOString() };
    return { ...e, orientacoes: [...e.orientacoes, nova] };
  });
  return nova;
}

// POST /verificar-urgencia (API Flask): só pode ELEVAR a gravidade.
export async function verificarUrgencia(dados: VerificacaoUrgenciaEntrada): Promise<{ urgente: boolean }> {
  // const res = await fetch(`${FLASK_URL}/verificar-urgencia`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  return { urgente: dados.nrDor >= 7 && dados.idade >= 65 };
}
