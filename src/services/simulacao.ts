import { chaveDia, proximosDiasAtendimento } from "@/lib/datas";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import { escolherDestinatarioOferta, horarioOferecivel, dispensadaConfirmacao, temContatoValido, segundosRestantesOferta } from "./regrasAgendamento";

export interface ResumoSimulacao {
  consultasLiberadas: number;
  vagasOferecidas: number;
  vagasDeVoltaNaAgenda: number;
  mantidasSemContato: number;
}

/** A mesma seleção vale para a oferta manual, automática e para o repasse. */
export function oferecerHorario(estado: EstadoSimulador, cdHorario: number, agora: Date): EstadoSimulador {
  const h = estado.horarios.find((x) => x.cdHorario === cdHorario);
  if (!h || !horarioOferecivel(h, estado.ofertas, agora)) return estado;
  const perdida = [...estado.consultas].reverse().find((c) => c.cdHorario === cdHorario && c.dsStatus === "LIBERADA");
  const entrada = escolherDestinatarioOferta(estado.listaDoDia.filter((e) => e.cdUnidade === h.cdUnidade), estado.ofertas, cdHorario, perdida?.cdCidadao ?? null);
  if (!entrada) return estado;
  return { ...estado, ofertas: [...estado.ofertas, { cdOferta: Math.max(0, ...estado.ofertas.map((o) => o.cdOferta)) + 1, cdHorario, cdUnidade: h.cdUnidade, cdEntrada: entrada.cdEntrada, nmCidadao: entrada.nmCidadao, dtCriacao: agora.toISOString(), status: "PENDENTE" }] };
}

export function finalizarOferta(estado: EstadoSimulador, cdOferta: number, resposta: "ACEITA" | "RECUSADA" | "EXPIRADA", agora: Date): EstadoSimulador {
  const oferta = estado.ofertas.find((o) => o.cdOferta === cdOferta && o.status === "PENDENTE");
  if (!oferta) return estado;
  const novo: EstadoSimulador = { ...estado, ofertas: estado.ofertas.map((o) => o.cdOferta === cdOferta ? { ...o, status: resposta } : o), listaDoDia: resposta === "ACEITA" ? estado.listaDoDia.map((e) => e.cdEntrada === oferta.cdEntrada ? { ...e, status: "ENCERRADA" } : e) : estado.listaDoDia };
  return resposta === "ACEITA" ? novo : oferecerHorario(novo, oferta.cdHorario, agora);
}

export function vencerOfertas(estado: EstadoSimulador, agora: Date, todas = false): EstadoSimulador {
  // Usar o conjunto inicial: novas ofertas não expiram no mesmo clique.
  return estado.ofertas.filter((o) => o.status === "PENDENTE" && (todas || segundosRestantesOferta(o, agora) === 0))
    .reduce((e, o) => finalizarOferta(e, o.cdOferta, "EXPIRADA", agora), estado);
}

/**
 * Fonte única da liberação de um horário: a consulta vira LIBERADA, o horário volta a ficar livre
 * e, com antecedência suficiente e alguém aguardando, é oferecido à lista do dia (oferecerHorario).
 * Usada pelo prazo de confirmação (simularPrazo) e pelo cancelamento.
 */
export function liberarConsulta(estado: EstadoSimulador, cdConsulta: number, agora: Date): { novoEstado: EstadoSimulador; oferecida: boolean } {
  const c = estado.consultas.find((x) => x.cdConsulta === cdConsulta);
  if (!c) return { novoEstado: estado, oferecida: false };
  const liberado: EstadoSimulador = {
    ...estado,
    consultas: estado.consultas.map((x) => (x.cdConsulta === cdConsulta ? { ...x, dsStatus: "LIBERADA" } : x)),
    horarios: estado.horarios.map((h) => (h.cdHorario === c.cdHorario ? { ...h, flOcupado: false } : h)),
  };
  const oferecido = oferecerHorario(liberado, c.cdHorario, agora);
  return { novoEstado: oferecido, oferecida: oferecido !== liberado };
}

/** Avança apenas o prazo das consultas no alcance, mantendo o relógio das vagas real. */
export function simularPrazo(estado: EstadoSimulador, agora: Date): { novoEstado: EstadoSimulador; resumo: ResumoSimulacao } {
  const resumo: ResumoSimulacao = { consultasLiberadas: 0, vagasOferecidas: 0, vagasDeVoltaNaAgenda: 0, mantidasSemContato: 0 };
  const dias = proximosDiasAtendimento(estado.horarios, estado.cdUnidadeRecepcao, agora);
  const alvo = estado.consultas.filter((c) => {
    const t = new Date(c.dtHorario).getTime();
    const unidade = estado.horarios.find((h) => h.cdHorario === c.cdHorario)?.cdUnidade;
    return c.dsStatus === "AGENDADA" && !dispensadaConfirmacao(c) &&
      ((unidade === estado.cdUnidadeRecepcao && t >= agora.getTime() && dias.includes(chaveDia(c.dtHorario))) || c.cdCidadao === estado.cdCidadaoAtual);
  });
  let novoEstado = estado;
  for (const c of alvo) {
    const cidadao = estado.cidadaos.find((p) => p.cdCidadao === c.cdCidadao);
    if (!cidadao || !temContatoValido(cidadao)) { resumo.mantidasSemContato++; continue; }
    const { novoEstado: liberado, oferecida } = liberarConsulta(novoEstado, c.cdConsulta, agora);
    resumo.consultasLiberadas++;
    if (oferecida) resumo.vagasOferecidas++; else resumo.vagasDeVoltaNaAgenda++;
    novoEstado = liberado;
  }
  return { novoEstado, resumo };
}
