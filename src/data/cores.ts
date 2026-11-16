import type { Cor } from "@/types/orientacao";

/**
 * Dados de cada cor de gravidade, usados no selo e na legenda.
 * Acessibilidade (WCAG 1.4.1 – uso da cor): a cor nunca aparece sozinha.
 * Cada uma tem um número (1 = mais grave, 5 = menos grave) e um nome,
 * para quem tem daltonismo ou usa leitor de tela.
 */
export interface DadosCor {
  /** Nível de 1 (mais grave) a 5 (menos grave). */
  nrNivel: number;
  /** Nome curto da cor (ex.: "Vermelho"). */
  nmCor: string;
  /** Nome com o destino, mostrado no selo (ex.: "Vermelho – SAMU"). */
  nmSelo: string;
  /** O que a cor significa. */
  dsSignificado: string;
  /** Para onde a pessoa deve ir. */
  dsOndeIr: string;
  /** Classes Tailwind de fundo e texto. No amarelo o texto é escuro, para ter contraste. */
  classe: string;
}

export const CORES: Record<Cor, DadosCor> = {
  VERMELHO: {
    nrNivel: 1,
    nmCor: "Vermelho",
    nmSelo: "Vermelho – SAMU",
    dsSignificado: "Emergência: risco imediato à vida.",
    dsOndeIr: "Ligue 192 (SAMU).",
    classe: "bg-gravidade-vermelho text-branco",
  },
  LARANJA: {
    nrNivel: 2,
    nmCor: "Laranja",
    nmSelo: "Laranja – Pronto-socorro",
    dsSignificado: "Muito urgente: precisa de atendimento rápido.",
    dsOndeIr: "Vá ao pronto-socorro.",
    classe: "bg-gravidade-laranja text-branco",
  },
  AMARELO: {
    nrNivel: 3,
    nmCor: "Amarelo",
    nmSelo: "Amarelo – UPA",
    dsSignificado: "Urgente: precisa ser avaliado hoje.",
    dsOndeIr: "Procure uma UPA.",
    classe: "bg-gravidade-amarelo text-texto",
  },
  VERDE: {
    nrNivel: 4,
    nmCor: "Verde",
    nmSelo: "Verde – UBS",
    dsSignificado: "Pouco urgente: pode ser atendido na UBS.",
    dsOndeIr: "Procure a UBS.",
    classe: "bg-gravidade-verde text-branco",
  },
  AZUL: {
    nrNivel: 5,
    nmCor: "Azul",
    nmSelo: "Azul – UBS",
    dsSignificado: "Não urgente: pode esperar uma consulta.",
    dsOndeIr: "Agende na UBS.",
    classe: "bg-gravidade-azul text-branco",
  },
};

/** Ordem de exibição: do nível 1 (mais grave) ao 5 (menos grave). */
export const ORDEM_CORES: Cor[] = ["VERMELHO", "LARANJA", "AMARELO", "VERDE", "AZUL"];
