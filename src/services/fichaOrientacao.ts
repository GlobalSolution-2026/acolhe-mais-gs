/**
 * Liga o cadastro e a ficha de saúde ao questionário de orientação (funções puras).
 * Exceção registrada no AGENTS.md: a orientação lê cadastro e ficha do estado de forma síncrona.
 */
import { idadeEm } from "@/lib/datas";
import type { Cidadao, CodigoDoencaBase, FichaSaude } from "@/types";
import type { CodigoQueixa, OrientacaoEmAndamento, Respostas } from "@/types/orientacao";
import { perguntasDaQueixa } from "./regrasOrientacao";

/** Doenças da ficha que permitem responder "SIM" a cada pergunta (hipertensão sozinha não conta). */
const DOENCAS_POR_PERGUNTA: Record<string, CodigoDoencaBase[]> = {
  P9: ["DIABETES", "PULMAO", "CORACAO", "RINS", "IMUNIDADE"],
  D11: ["DIABETES"],
  U7: ["DIABETES", "IMUNIDADE"],
};

const NOME_DOENCA: Partial<Record<CodigoDoencaBase, string>> = {
  DIABETES: "diabetes",
  PULMAO: "doença do pulmão",
  CORACAO: "doença do coração",
  RINS: "doença dos rins",
  IMUNIDADE: "baixa imunidade",
};

export interface DadosDaFicha {
  respostas: Respostas;
  /** O que foi usado, para o aviso de transparência (ex.: "idade", "sexo", "diabetes"). */
  usados: string[];
}

const NADA: DadosDaFicha = { respostas: {}, usados: [] };

/**
 * Respostas tiradas do cadastro e da ficha, só quando a orientação é para a própria pessoa.
 * Doenças: só respostas positivas — se a ficha não tem a doença, a pergunta continua sendo feita.
 * A gestação (PF3) nunca vem da ficha.
 */
export function respostasDaFicha(
  queixa: CodigoQueixa,
  respostas: Respostas,
  cidadao: Cidadao | null,
  ficha: FichaSaude | null,
  hoje: Date,
): DadosDaFicha {
  if (!cidadao || respostas["PF1"] !== "PARA_MIM") return NADA;
  const r: Respostas = {};
  const usados: string[] = [];
  const idade = idadeEm(cidadao.dtNascimento, hoje);
  if (idade !== null) {
    r["PF2"] = idade;
    usados.push("idade");
  }
  r["SX"] = cidadao.dsSexo;
  usados.push("sexo");

  const daQueixa = new Map(perguntasDaQueixa(queixa).map((p) => [p.codigo, p]));
  for (const [codigo, doencas] of Object.entries(DOENCAS_POR_PERGUNTA)) {
    const pergunta = daQueixa.get(codigo);
    const presentes = pergunta ? doencas.filter((d) => ficha?.dsDoencasBase.includes(d)) : [];
    if (presentes.length === 0) continue;
    // Perguntas de marcar (P9, U7) recebem as doenças da ficha, que usam os mesmos valores das opções.
    r[codigo] = pergunta?.tipoResposta === "MULTIPLA" ? presentes : "SIM";
    for (const d of presentes) {
      const nome = NOME_DOENCA[d];
      if (nome && !usados.includes(nome)) usados.push(nome);
    }
  }
  return { respostas: r, usados };
}

/** Partes do estado usadas na orientação (recebidas separadas para as telas poderem memorizar). */
export interface FontesOrientacao {
  orientacaoAtual: OrientacaoEmAndamento | null;
  cidadaos: Cidadao[];
  cdCidadaoAtual: number | null;
  fichas?: FichaSaude[] | undefined;
}

/** Respostas efetivas da orientação atual: as digitadas valem mais que as da ficha. */
export function respostasEfetivas(fontes: FontesOrientacao, hoje: Date): DadosDaFicha | null {
  const atual = fontes.orientacaoAtual;
  if (!atual) return null;
  const cidadao = fontes.cidadaos.find((c) => c.cdCidadao === fontes.cdCidadaoAtual) ?? null;
  const ficha = cidadao ? (fontes.fichas ?? []).find((f) => f.cdCidadao === cidadao.cdCidadao) ?? null : null;
  const daFicha = respostasDaFicha(atual.cdQueixa, atual.respostas, cidadao, ficha, hoje);
  return { respostas: { ...daFicha.respostas, ...atual.respostas }, usados: daFicha.usados };
}

/** "Usamos dados do seu cadastro e da sua ficha de saúde: idade, sexo e diabetes." */
export function textoAvisoFicha(usados: string[]): string {
  const comFicha = usados.some((u) => u !== "idade" && u !== "sexo");
  const lista = usados.length > 1 ? `${usados.slice(0, -1).join(", ")} e ${usados[usados.length - 1]}` : (usados[0] ?? "");
  return `Usamos dados do seu cadastro${comFicha ? " e da sua ficha de saúde" : ""}: ${lista}.`;
}
