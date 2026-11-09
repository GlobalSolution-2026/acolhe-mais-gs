import type { Cor } from "./orientacao";

export type TipoUnidade = "UBS" | "UPA";

export interface Unidade {
  cdUnidade: number;
  nmUnidade: string;
  tpUnidade: TipoUnidade;
  dsEndereco: string;
  nrCep: string;
  nrTelefone: string;
}

export interface Horario {
  cdHorario: number;
  cdUnidade: number;
  dtHorario: string; // ISO
  nrDuracaoMin: number;
  flOcupado: boolean;
}

export interface Cidadao {
  cdCidadao: number;
  nmCidadao: string;
  nrCns: string;
  dtNascimento: string;
  dsSexo: "F" | "M";
  nrCelular: string;
  nmContatoRecado: string;
  nrContatoRecado: string;
  nrCep: string;
}

export type CidadaoEntrada = Omit<Cidadao, "cdCidadao">;

export type StatusConsulta = "AGENDADA" | "CONFIRMADA" | "LIBERADA" | "REALIZADA" | "FALTA";
export type CanalConfirmacao = "APP" | "TELEFONE" | "PRESENCIAL";

export interface Consulta {
  cdConsulta: number;
  cdHorario: number;
  cdCidadao: number;
  cdOrientacao: number | null;
  dtAgendamento: string;
  dtConfirmacao: string | null;
  dsCanalConfirmacao: CanalConfirmacao | null;
  dsStatus: StatusConsulta;
  vlProbFalta: number;
  dsRiscoFalta: "BAIXO" | "ALTO";
  nmUnidade: string;
  dtHorario: string;
}

/** Pessoa aguardando encaixe na lista do dia de uma UBS. */
export interface EntradaListaDoDia {
  cdEntrada: number;
  cdCidadao: number | null;
  cdUnidade: number;
  nmCidadao: string;
  dsCor: Extract<Cor, "VERDE" | "AZUL">;
  dtEntrada: string; // ISO
  /** Quem não foi encaixado no dia anterior tem prioridade. */
  flPrioridade: boolean;
  /** true quando a entrada é do próprio cidadão que usa o app. */
  flCidadao: boolean;
  status: "AGUARDANDO" | "ENCERRADA";
}

export type StatusOferta = "PENDENTE" | "ACEITA" | "RECUSADA" | "EXPIRADA";

/** Oferta de vaga liberada feita ao primeiro da lista do dia. */
export interface OfertaVaga {
  cdOferta: number;
  cdHorario: number;
  cdUnidade: number;
  cdEntrada: number;
  nmCidadao: string;
  dtCriacao: string; // ISO
  status: StatusOferta;
}

export interface ErroResponse {
  status: number;
  erro: string;
}

export type CodigoDoencaBase = "DIABETES" | "HIPERTENSAO" | "PULMAO" | "CORACAO" | "RINS" | "IMUNIDADE" | "OUTRA";
export type TipoSanguineo = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "NAO_SEI" | "";

export interface MedicamentoContinuo {
  nmMedicamento: string;
  dsDose: string;
}

/** Ficha de saúde opcional do cidadão (dado sensível — LGPD, art. 11). */
export interface FichaSaude {
  cdCidadao: number;
  dsDoencasBase: CodigoDoencaBase[];
  dsOutraDoenca: string;
  medicamentos: MedicamentoContinuo[];
  dsAlergias: string;
  dsTipoSanguineo: TipoSanguineo;
  flConsentimento: boolean;
  dtAtualizacao: string; // ISO
}

/** Credencial mock (a autenticação real será feita pela API Java). */
export interface CredencialCidadao {
  cdCidadao: number;
  dsSenha: string;
}
