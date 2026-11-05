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

export interface Consulta {
  cdConsulta: number;
  cdHorario: number;
  cdCidadao: number;
  cdOrientacao: number | null;
  dtAgendamento: string;
  dtConfirmacao: string | null;
  dsStatus: StatusConsulta;
  vlProbFalta: number;
  dsRiscoFalta: "BAIXO" | "ALTO";
  nmUnidade: string;
  dtHorario: string;
}

export interface ErroResponse {
  status: number;
  erro: string;
}
