/**
 * Camada de serviços do Acolhe+.
 * As funções Java seguem os endpoints REST planejados; Flask e ações locais estão identificados.
 * No protótipo, lê/altera o estado mockado do Context e espera 400 ms.
 */
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { CanalConfirmacao, Cidadao, FichaSaude, CidadaoEntrada, Consulta, ErroResponse, Horario, Unidade } from "@/types";
import type { Orientacao, VerificacaoUrgenciaEntrada } from "@/types/orientacao";
import { idadeEm } from "@/lib/datas";
import { segundosRestantesOferta, temContatoValido } from "./regrasAgendamento";

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

// GET /unidades — filtro de tipo aplicado no front.
export async function listarUnidades(tipo?: Unidade["tpUnidade"]): Promise<Unidade[]> {
  // const res = await fetch(`${API_URL}/unidades`);
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // const unidades: Unidade[] = await res.json();
  // return tipo ? unidades.filter((u) => u.tpUnidade === tipo) : unidades;
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
  const novo: Cidadao = { ...dados, cdCidadao: Math.max(0, ...s.obterEstado().cidadaos.map((c) => c.cdCidadao)) + 1 };
  s.atualizarEstado((e) => {
    return { ...e, cidadaos: [...e.cidadaos, novo] };
  });
  return novo;
}

// POST /auth/entrar — MOCK: a autenticação real será feita pela API Java.
export async function entrar(nrCns: string, dsSenha: string): Promise<Cidadao> {
  // const res = await fetch(`${API_URL}/auth/entrar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nrCns, dsSenha }) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  await esperar();
  const s = getStore();
  const e = s.obterEstado();
  const cidadao = e.cidadaos.find((c) => c.nrCns === nrCns.replace(/\D/g, ""));
  const credencial = cidadao && (e.credenciais ?? []).find((c) => c.cdCidadao === cidadao.cdCidadao);
  if (!cidadao || !credencial || credencial.dsSenha !== dsSenha) falhar({ status: 401, erro: "Cartão SUS ou senha incorretos." });
  return cidadao;
}

// POST /auth/sair — MOCK
export async function sair(): Promise<void> {
  await esperar(100);
  getStore().atualizarEstado((e) => ({ ...e, cdCidadaoAtual: null }));
}

// POST /cidadaos (com senha) — MOCK de criação de conta
export async function criarConta(dados: CidadaoEntrada, dsSenha: string): Promise<Cidadao> {
  if (dsSenha.length < 6) falhar({ status: 400, erro: "A senha precisa ter pelo menos 6 caracteres." });
  const s = getStore();
  const existente = s.obterEstado().cidadaos.find((c) => c.nrCns === dados.nrCns);
  // Cadastro feito antes pela recepção (sem senha) pode ganhar uma conta.
  if (existente && (s.obterEstado().credenciais ?? []).some((c) => c.cdCidadao === existente.cdCidadao)) falhar({ status: 409, erro: "Já existe conta com este Cartão SUS. Use Entrar." });
  const cidadao = existente ? await atualizarCidadao(existente.cdCidadao, dados) : await cadastrarCidadao(dados);
  s.atualizarEstado((e) => ({ ...e, credenciais: [...(e.credenciais ?? []), { cdCidadao: cidadao.cdCidadao, dsSenha }] }));
  return cidadao;
}

// GET /cidadaos/{cdCidadao}/ficha
export async function buscarFicha(cdCidadao: number): Promise<FichaSaude | null> {
  await esperar(150);
  return (getStore().obterEstado().fichas ?? []).find((f) => f.cdCidadao === cdCidadao) ?? null;
}

// PUT /cidadaos/{cdCidadao}/ficha
export async function salvarFicha(ficha: Omit<FichaSaude, "dtAtualizacao">): Promise<FichaSaude> {
  if (!ficha.flConsentimento) falhar({ status: 400, erro: "Marque a autorização (LGPD) para salvar a ficha." });
  await esperar();
  const nova: FichaSaude = { ...ficha, dtAtualizacao: new Date().toISOString() };
  getStore().atualizarEstado((e) => ({ ...e, fichas: [...(e.fichas ?? []).filter((f) => f.cdCidadao !== ficha.cdCidadao), nova] }));
  return nova;
}

// DELETE /cidadaos/{cdCidadao}/ficha
export async function apagarFicha(cdCidadao: number): Promise<void> {
  await esperar();
  getStore().atualizarEstado((e) => ({ ...e, fichas: (e.fichas ?? []).filter((f) => f.cdCidadao !== cdCidadao) }));
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
export async function agendarConsulta(dados: { cdHorario: number; cdCidadao: number; cdOrientacao: number | null; cdOferta?: number }): Promise<Consulta> {
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
  const idade = idadeEm(cidadao.dtNascimento, new Date()) ?? 0;
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
  s.atualizarEstado((atual) => {
    if (atual.horarios.some((h) => h.cdHorario === dados.cdHorario && h.flOcupado)) falhar({ status: 409, erro: "Este horário acabou de ser ocupado. Escolha outro." });
    const oferta = atual.ofertas.find((o) => o.cdOferta === dados.cdOferta && o.cdHorario === dados.cdHorario && o.status === "PENDENTE");
    const entrada = atual.listaDoDia.find((x) => x.cdEntrada === oferta?.cdEntrada);
    if (dados.cdOferta && (!oferta || !entrada || entrada.cdCidadao !== dados.cdCidadao || segundosRestantesOferta(oferta, new Date()) === 0)) falhar({ status: 409, erro: "Esta oferta venceu ou foi repassada. Confira seus avisos." });
    const nova = { ...consulta, cdConsulta: Math.max(0, ...atual.consultas.map((c) => c.cdConsulta)) + 1 };
    consulta.cdConsulta = nova.cdConsulta;
    return { ...atual, horarios: atual.horarios.map((h) => h.cdHorario === dados.cdHorario ? { ...h, flOcupado: true } : h), consultas: [...atual.consultas, nova], ofertas: atual.ofertas.map((o) => o.cdOferta === dados.cdOferta ? { ...o, status: "ACEITA" } : o), listaDoDia: atual.listaDoDia.map((x) => x.cdEntrada === entrada?.cdEntrada ? { ...x, status: "ENCERRADA" } : x) };
  });
  return consulta;
}

// PUT /consultas/{cdConsulta} — confirmar presença
export async function confirmarConsulta(cdConsulta: number, canal: CanalConfirmacao): Promise<Consulta> {
  await esperar();
  const s = getStore();
  const atual = s.obterEstado().consultas.find((c) => c.cdConsulta === cdConsulta);
  if (!atual) falhar({ status: 404, erro: "Consulta não encontrada." });
  const nova: Consulta = { ...atual, dsStatus: "CONFIRMADA", dtConfirmacao: new Date().toISOString(), dsCanalConfirmacao: canal };
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nova) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  s.atualizarEstado((e) => ({ ...e, consultas: e.consultas.map((c) => (c.cdConsulta === cdConsulta ? nova : c)) }));
  return nova;
}

// PUT /consultas/{cdConsulta} — registrar presença ou falta
export async function registrarPresenca(cdConsulta: number, status: "REALIZADA" | "FALTA"): Promise<Consulta> {
  await esperar();
  const s = getStore();
  const atual = s.obterEstado().consultas.find((c) => c.cdConsulta === cdConsulta);
  if (!atual) falhar({ status: 404, erro: "Consulta não encontrada." });
  const nova: Consulta = { ...atual, dsStatus: status };
  // const res = await fetch(`${API_URL}/consultas/${cdConsulta}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nova) });
  // if (!res.ok) { const erro: ErroResponse = await res.json(); throw new Error(erro.erro); }
  // return res.json();
  s.atualizarEstado((e) => ({ ...e, consultas: e.consultas.map((c) => (c.cdConsulta === cdConsulta ? nova : c)) }));
  return nova;
}

/** DEMONSTRAÇÃO: fica só no front; não existe na API Java. */
export async function salvarOrientacao(dados: Omit<Orientacao, "cdOrientacao" | "dtOrientacao">): Promise<Orientacao> {
  await esperar();
  const s = getStore();
  const nova: Orientacao = { ...dados, cdOrientacao: Math.max(0, ...s.obterEstado().orientacoes.map((o) => o.cdOrientacao)) + 1, dtOrientacao: new Date().toISOString() };
  s.atualizarEstado((e) => {
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

// GET viacep.com.br/ws/{cep}/json/ (API externa, chamada real pelo front)
export { buscarEndereco } from "./cep";

/** DEMONSTRAÇÃO: valida o aceite e utiliza o endpoint Java de agendamento. */
export async function aceitarOfertaPorTelefone(cdOferta: number): Promise<Consulta> {
  const e = getStore().obterEstado();
  const oferta = e.ofertas.find((o) => o.cdOferta === cdOferta && o.status === "PENDENTE");
  const entrada = e.listaDoDia.find((x) => x.cdEntrada === oferta?.cdEntrada);
  if (!oferta || segundosRestantesOferta(oferta, new Date()) === 0 || !entrada || entrada.cdCidadao === null) falhar({ status: 409, erro: "Oferta indisponível." });
  const consulta = await agendarConsulta({ cdHorario: oferta.cdHorario, cdCidadao: entrada.cdCidadao, cdOrientacao: null, cdOferta });
  getStore().atualizarEstado((atual) => ({ ...atual, ofertas: atual.ofertas.map((o) => o.cdOferta === cdOferta ? { ...o, status: "ACEITA" } : o), listaDoDia: atual.listaDoDia.map((x) => x.cdEntrada === entrada.cdEntrada ? { ...x, status: "ENCERRADA" } : x) }));
  return consulta;
}
