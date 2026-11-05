/**
 * Camada de serviços do Acolhe+.
 * Cada função tem o nome e formato de um endpoint REST da futura API Java.
 * No protótipo, lê/altera o estado mockado do Context e espera 400 ms.
 */
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { Cidadao, CidadaoEntrada, Consulta, ErroResponse, Horario, Unidade } from "@/types";

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
export async function getUnidades(tipo?: Unidade["tpUnidade"]): Promise<Unidade[]> {
  // const res = await fetch(`${API_URL}/unidades${tipo ? `?tipo=${tipo}` : ""}`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const { unidades } = getStore().obterEstado();
  return tipo ? unidades.filter((u) => u.tpUnidade === tipo) : unidades;
}

// GET /unidades/{cdUnidade}/horarios
export async function getHorariosPorUnidade(cdUnidade: number): Promise<Horario[]> {
  // const res = await fetch(`${API_URL}/unidades/${cdUnidade}/horarios`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const { unidades, horarios } = getStore().obterEstado();
  if (!unidades.some((u) => u.cdUnidade === cdUnidade)) falhar({ status: 404, erro: "Unidade não encontrada." });
  return horarios.filter((h) => h.cdUnidade === cdUnidade);
}

// POST /cidadaos
export async function postCidadao(dados: CidadaoEntrada): Promise<Cidadao> {
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

// GET /cidadaos/{cdCidadao}/consultas
export async function getConsultasPorCidadao(cdCidadao: number): Promise<Consulta[]> {
  // const res = await fetch(`${API_URL}/cidadaos/${cdCidadao}/consultas`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  return getStore().obterEstado().consultas.filter((c) => c.cdCidadao === cdCidadao);
}

// POST /consultas
export async function postConsulta(cdHorario: number, cdCidadao: number, cdOrientacao: number | null = null): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cdHorario, cdCidadao, cdOrientacao }) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  const e = s.obterEstado();
  const horario = e.horarios.find((h) => h.cdHorario === cdHorario);
  if (!horario) falhar({ status: 404, erro: "Horário não encontrado." });
  if (horario.flOcupado) falhar({ status: 409, erro: "Este horário já foi ocupado." });
  const unidade = e.unidades.find((u) => u.cdUnidade === horario.cdUnidade);
  const prob = Math.round(Math.random() * 100) / 100;
  const consulta: Consulta = {
    cdConsulta: Math.max(0, ...e.consultas.map((c) => c.cdConsulta)) + 1,
    cdHorario,
    cdCidadao,
    cdOrientacao,
    dtAgendamento: new Date().toISOString(),
    dtConfirmacao: null,
    dsStatus: "AGENDADA",
    vlProbFalta: prob,
    dsRiscoFalta: prob >= 0.5 ? "ALTO" : "BAIXO",
    nmUnidade: unidade?.nmUnidade ?? "",
    dtHorario: horario.dtHorario,
  };
  s.atualizarEstado((atual) => ({
    ...atual,
    horarios: atual.horarios.map((h) => (h.cdHorario === cdHorario ? { ...h, flOcupado: true } : h)),
    consultas: [...atual.consultas, consulta],
  }));
  return consulta;
}

// PATCH /consultas/{cdConsulta}/confirmar
export async function confirmarConsulta(cdConsulta: number): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}/confirmar`, { method: "PATCH" });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  return alterarStatus(cdConsulta, "CONFIRMADA");
}

// PATCH /consultas/{cdConsulta}/liberar
export async function liberarConsulta(cdConsulta: number): Promise<Consulta> {
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}/liberar`, { method: "PATCH" });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  return alterarStatus(cdConsulta, "LIBERADA");
}

async function alterarStatus(cdConsulta: number, dsStatus: Consulta["dsStatus"]): Promise<Consulta> {
  await esperar();
  const s = getStore();
  const atual = s.obterEstado().consultas.find((c) => c.cdConsulta === cdConsulta);
  if (!atual) falhar({ status: 404, erro: "Consulta não encontrada." });
  const nova: Consulta = { ...atual, dsStatus, dtConfirmacao: dsStatus === "CONFIRMADA" ? new Date().toISOString() : atual.dtConfirmacao };
  s.atualizarEstado((e) => ({
    ...e,
    consultas: e.consultas.map((c) => (c.cdConsulta === cdConsulta ? nova : c)),
    horarios: dsStatus === "LIBERADA" ? e.horarios.map((h) => (h.cdHorario === atual.cdHorario ? { ...h, flOcupado: false } : h)) : e.horarios,
  }));
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
