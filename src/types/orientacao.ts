export type CodigoQueixa = "GRIPAL" | "GARGANTA" | "DIARREIA" | "CABECA" | "URINA";
export type Cor = "VERMELHO" | "LARANJA" | "AMARELO" | "VERDE" | "AZUL";
export type Destino = "SAMU" | "PRONTO_SOCORRO" | "UPA" | "UBS";

export type BlocoPergunta = "PERFIL" | "ENTRADA" | "ALARME" | "LARANJA" | "URGENCIA" | "CLASSIFICACAO";
export type TipoResposta = "SIM_NAO" | "SIM_NAO_NAOSEI" | "NUMERO" | "ESCALA_DOR" | "MULTIPLA" | "OPCOES";

/** Valor de uma resposta: "SIM" | "NAO" | "NAO_SEI" | valor de opção, número ou lista (múltipla). */
export type Resposta = string | number | string[];
export type Respostas = Record<string, Resposta>;

export type CondicaoExibicao =
  | { tipo: "IDADE_MIN"; valor: number }
  | { tipo: "IDADE_MAX"; valor: number }
  | { tipo: "DOR_MIN"; valor: number }
  | { tipo: "RESPOSTA_EM"; codigo: string; valores: string[] }
  | { tipo: "RESPOSTA_DIFERENTE"; codigo: string; valor: string }
  | { tipo: "TODAS"; condicoes: CondicaoExibicao[] };

export interface Opcao {
  valor: string;
  rotulo: string;
  /** Texto na lista de sinais (perguntas de marcar); sem ele, usa o rótulo. */
  sinal?: string;
}

export interface Pergunta {
  cdPergunta: number;
  cdQueixa: number | null;
  codigo: string;
  dsPergunta: string;
  nrOrdem: number;
  bloco: BlocoPergunta;
  tipoResposta: TipoResposta;
  opcoes?: Opcao[];
  dsCorSeSim: Cor | null;
  dsRespostaAlarme?: "SIM" | "NAO";
  condicaoExibicao?: CondicaoExibicao;
  /** Texto curto usado na lista de sinais marcados. */
  dsSinal?: string;
}

export interface Queixa {
  cdQueixa: number;
  codigo: CodigoQueixa;
  nmQueixa: string;
}

export interface ResultadoOrientacao {
  dsCor: Cor;
  dsDestino: Destino;
  sinaisMarcados: string[];
}

export interface Orientacao {
  cdOrientacao: number;
  cdQueixa: number;
  dsCor: Cor;
  dsDestino: Destino;
  nrDor: number | null;
  flElevadaModelo: boolean;
  dtOrientacao: string;
}

export interface ResultadoFinal extends ResultadoOrientacao {
  cdOrientacao: number;
  nrDor: number | null;
  flElevadaModelo: boolean;
}

export interface EnderecoCep {
  dsLogradouro: string;
  dsBairro: string;
  nmCidade: string;
  sgUf: string;
}

export interface OrientacaoEmAndamento {
  cdQueixa: CodigoQueixa;
  nrCep: string;
  /** Dados do ViaCEP; ausentes se a consulta falhou (o CEP sozinho basta). */
  endereco?: EnderecoCep | null;
  nrEndereco?: string;
  dsComplemento?: string;
  respostas: Respostas;
  ordem: string[];
  resultado: ResultadoFinal | null;
}

export type LocalOrientacao = Pick<OrientacaoEmAndamento, "endereco" | "nrEndereco" | "dsComplemento">;

export interface VerificacaoUrgenciaEntrada {
  idade: number;
  sexo: "F" | "M" | null;
  trauma: boolean;
  nrDor: number;
  estadoMentalAlerta: boolean;
}
