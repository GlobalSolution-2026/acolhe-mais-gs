/**
 * Regras de orientação do Acolhe+ (funções puras, sem React).
 * Regra geral: "Não sei" vale como o pior caso, exceto onde indicado.
 */
import { perguntas } from "@/data/perguntas";
import { obterQueixa } from "@/data/queixas";
import type {
  CodigoQueixa, CondicaoExibicao, Cor, Destino, Pergunta, Respostas, ResultadoOrientacao,
} from "@/types/orientacao";

export const DESTINO_POR_COR: Record<Cor, Destino> = {
  VERMELHO: "SAMU",
  LARANJA: "PRONTO_SOCORRO",
  AMARELO: "UPA",
  VERDE: "UBS",
  AZUL: "UBS",
};

const PESO: Record<Cor, number> = { AZUL: 0, VERDE: 1, AMARELO: 2, LARANJA: 3, VERMELHO: 4 };

const respostaAlarme = (c: string) => perguntas.find((p) => p.codigo === c)?.dsRespostaAlarme ?? "SIM";
const sim = (r: Respostas, c: string) => r[c] === respostaAlarme(c);
const simOuNaoSei = (r: Respostas, c: string) => sim(r, c) || r[c] === "NAO_SEI";
const num = (r: Respostas, c: string): number | null => (typeof r[c] === "number" ? (r[c] as number) : null);
const entre = (v: number | null, min: number, max: number) => v !== null && v >= min && v <= max;

/** Gestação ou pós-parto recente: grupo de risco para gripe e infecção urinária. */
export const grupoRiscoGestacao = (r: Respostas): boolean =>
  ["GRAVIDA_ATE_5M", "GRAVIDA_5M_MAIS", "POS_PARTO_2SEM"].includes(String(r["PF3"]));

/** Gravidez a partir de 5 meses ou pós-parto até 6 semanas: alarme na dor de cabeça. */
export const alarmeGestacaoCabeca = (r: Respostas): boolean =>
  ["GRAVIDA_5M_MAIS", "POS_PARTO_2SEM", "POS_PARTO_6SEM"].includes(String(r["PF3"]));

/* D1 (diarreia): sangue no vômito ou nas fezes, com o sinal conforme a opção. */
const SINAL_SANGUE_HOJE = "Sangue no vômito ou nas fezes hoje";
const SINAL_SANGUE_RECENTE = "Sangue nos últimos dias";
const sangueHoje = (r: Respostas) => r["D1"] === "HOJE";
const sangueRecente = (r: Respostas) => r["D1"] === "ULTIMOS_DIAS" || r["D1"] === "NAO_SEI";

function precisaInstabilidade(queixa: CodigoQueixa, r: Respostas): boolean {
  return (queixa === "GRIPAL" && sim(r, "P5")) ||
    (queixa === "DIARREIA" && (sangueHoje(r) || sim(r, "D3b") || entre(num(r, "DOR"), 8, 10)));
}

/** Busca a pergunta comum ou a da queixa (a INST tem uma versão por queixa). */
function sinal(codigo: string, queixa: CodigoQueixa): string {
  const cd = obterQueixa(queixa).cdQueixa;
  const p = perguntas.find((x) => x.codigo === codigo && (x.cdQueixa === null || x.cdQueixa === cd));
  return p?.dsSinal ?? p?.dsPergunta ?? codigo;
}

export function calcularOrientacao(queixa: CodigoQueixa, respostas: Respostas): ResultadoOrientacao {
  const r = respostas;
  const idade = num(r, "PF2") ?? 0;
  const dor = num(r, "DOR");
  const sinais: string[] = [];
  const marcar = (codigos: string[], teste: (c: string) => boolean) => {
    const marcados = codigos.filter(teste);
    marcados.forEach((c) => sinais.push(sinal(c, queixa)));
    return marcados.length > 0;
  };
  const fim = (dsCor: Cor): ResultadoOrientacao => ({ dsCor, dsDestino: DESTINO_POR_COR[dsCor], sinaisMarcados: sinais });
  const comInstabilidade = (): ResultadoOrientacao => {
    if (simOuNaoSei(r, "INST")) {
      sinais.push(sinal("INST", queixa));
      return fim("VERMELHO");
    }
    return fim("LARANJA");
  };

  switch (queixa) {
    case "GRIPAL": {
      if (marcar(["P1", "P2", "P3", "P4"], (c) => sim(r, c))) return fim("VERMELHO");
      if (marcar(["P5"], (c) => sim(r, c))) return comInstabilidade();
      if (marcar(["P6", "P7", "P8", "P8a", "P8b"], (c) => simOuNaoSei(r, c))) return fim("AMARELO");
      if (idade >= 60 || grupoRiscoGestacao(r)) return fim("VERDE");
      if (simOuNaoSei(r, "P9")) return fim("VERDE");
      const febre = Array.isArray(r["P0"]) && r["P0"].includes("FEBRE");
      return fim(febre ? "VERDE" : "AZUL");
    }
    case "GARGANTA": {
      if (marcar(["G1"], (c) => sim(r, c))) return fim("VERMELHO");
      if (marcar(["G2", "G3", "G4", "G5"], (c) => sim(r, c))) return fim("LARANJA");
      // Exceção: "Não sei" no G5 leva a AMARELO, não a LARANJA.
      const g5NaoSei = marcar(["G5"], (c) => r[c] === "NAO_SEI");
      const g6 = marcar(["G6"], (c) => simOuNaoSei(r, c));
      if (g5NaoSei || g6) return fim("AMARELO");
      return fim(sim(r, "G7") ? "VERDE" : "AZUL");
    }
    case "DIARREIA": {
      if (marcar(["D3a", "D5"], (c) => sim(r, c))) return fim("VERMELHO");
      if (sangueHoje(r)) sinais.push(SINAL_SANGUE_HOJE);
      const d3b = marcar(["D3b"], (c) => sim(r, c));
      if (entre(dor, 8, 10)) sinais.push(`Dor muito forte (nota ${dor})`);
      if (sangueHoje(r) || d3b || entre(dor, 8, 10)) return comInstabilidade();
      // Exceção: "Não sei" na D1 leva a AMARELO, não a LARANJA (sem sangramento evidente).
      if (sangueRecente(r)) sinais.push(SINAL_SANGUE_RECENTE);
      const urg = marcar(["D7", "D8", "D10", "D11a"], (c) => simOuNaoSei(r, c));
      if (entre(dor, 5, 7)) sinais.push(`Dor moderada (nota ${dor})`);
      if (sangueRecente(r) || urg || entre(dor, 5, 7)) return fim("AMARELO");
      return fim(sim(r, "D12") || sim(r, "D13") ? "VERDE" : "AZUL");
    }
    case "CABECA": {
      if (marcar(["C1", "C2", "C3", "C4"], (c) => sim(r, c))) return fim("VERMELHO");
      if (marcar(["C5"], (c) => sim(r, c))) return fim("LARANJA");
      const urg = marcar(["C6", "C7", "C8", "C9"], (c) => simOuNaoSei(r, c));
      const gestacao = alarmeGestacaoCabeca(r);
      if (gestacao) sinais.push("Gravidez avançada ou pós-parto");
      if (urg || gestacao) return fim("AMARELO");
      return fim(entre(dor, 5, 7) || sim(r, "C11") ? "VERDE" : "AZUL");
    }
    case "URINA": {
      if (marcar(["U1"], (c) => sim(r, c))) return fim("VERMELHO");
      const u4 = marcar(["U4"], (c) => simOuNaoSei(r, c));
      const dorForte = entre(dor, 8, 10);
      if (dorForte) sinais.push(`Dor muito forte (nota ${dor})`);
      const combinada = simOuNaoSei(r, "U2") && sim(r, "U3");
      if (combinada) sinais.push(sinal("U2", queixa), sinal("U3", queixa));
      if (u4 || dorForte || combinada) return fim("AMARELO");
      const verde = sim(r, "U3") || grupoRiscoGestacao(r) || idade >= 60 || r["SX"] === "M" || simOuNaoSei(r, "U7");
      return fim(verde ? "VERDE" : "AZUL");
    }
  }
}

/* ---------- Motor do questionário ---------- */

export type PassoOrientacao =
  | { tipo: "PERGUNTA"; pergunta: Pergunta; progresso: number }
  | { tipo: "MENOR_IDADE" }
  | { tipo: "POUCOS_SINTOMAS" }
  | { tipo: "SUGERIR_GRIPAL" }
  | { tipo: "RESULTADO" };

function condicaoAtendida(c: CondicaoExibicao | undefined, r: Respostas): boolean {
  if (!c) return true;
  const idade = num(r, "PF2") ?? 0;
  switch (c.tipo) {
    case "IDADE_MIN": return idade >= c.valor;
    case "IDADE_MAX": return idade <= c.valor;
    case "DOR_MIN": return (num(r, "DOR") ?? 0) >= c.valor;
    case "RESPOSTA_EM": return c.valores.includes(String(r[c.codigo]));
    case "RESPOSTA_DIFERENTE": return r[c.codigo] !== c.valor;
    case "TODAS": return c.condicoes.every((x) => condicaoAtendida(x, r));
  }
}

export function perguntasDaQueixa(queixa: CodigoQueixa): Pergunta[] {
  const cd = obterQueixa(queixa).cdQueixa;
  const ordem = { PERFIL: 0, ENTRADA: 1, ALARME: 2, LARANJA: 3, URGENCIA: 5, CLASSIFICACAO: 6 };
  const prioridade = (p: Pergunta) => p.codigo === "INST" ? 4 : ordem[p.bloco];
  return perguntas.filter((p) => p.cdQueixa === null || p.cdQueixa === cd)
    .sort((a, b) => prioridade(a) - prioridade(b) || a.nrOrdem - b.nrOrdem);
}

function visivel(p: Pergunta, queixa: CodigoQueixa, r: Respostas): boolean {
  if (p.codigo === "INST") return precisaInstabilidade(queixa, r);
  if (!condicaoAtendida(p.condicaoExibicao, r)) return false;
  // Com urgência já definida, a classificação não muda o destino.
  if (p.bloco === "CLASSIFICACAO" && PESO[calcularOrientacao(queixa, r).dsCor] >= PESO.AMARELO) return false;
  return true;
}

export function proximoPasso(queixa: CodigoQueixa, r: Respostas): PassoOrientacao {
  const idade = num(r, "PF2");
  if (idade !== null && idade < 18) return { tipo: "MENOR_IDADE" };
  if (queixa === "GRIPAL" && Array.isArray(r["P0"]) && r["P0"].length < 2) return { tipo: "POUCOS_SINTOMAS" };
  if (queixa === "GARGANTA" && r["G0"] === "SIM") return { tipo: "SUGERIR_GRIPAL" };
  const lista = perguntasDaQueixa(queixa);
  const respondidas = lista.filter((p) => p.codigo in r).length;
  const pendentes = lista.filter((p) => !(p.codigo in r) && visivel(p, queixa, r));
  const cor = calcularOrientacao(queixa, r).dsCor;
  const aguardaInst = precisaInstabilidade(queixa, r) && !("INST" in r);
  if (cor === "VERMELHO") return { tipo: "RESULTADO" };
  if (cor === "LARANJA") {
    // A dor já é conhecida no perfil: não pode esconder nenhum alarme vermelho.
    const anteriores = pendentes.filter((p) => ["PERFIL", "ENTRADA", "ALARME"].includes(p.bloco));
    const pergunta = anteriores[0] ?? (aguardaInst ? pendentes.find((p) => p.bloco === "LARANJA") : undefined);
    if (!pergunta) return { tipo: "RESULTADO" };
    return { tipo: "PERGUNTA", pergunta, progresso: respondidas / (respondidas + pendentes.length) };
  }
  const pergunta = pendentes[0];
  if (!pergunta) return { tipo: "RESULTADO" };
  return { tipo: "PERGUNTA", pergunta, progresso: respondidas / (respondidas + pendentes.length) };
}

export function textoPergunta(p: Pergunta, r: Respostas): string {
  const outra = r["PF1"] === "OUTRA_PESSOA";
  return p.dsPergunta.replaceAll("{voce}", outra ? "a pessoa" : "você").replaceAll("{Voce}", outra ? "A pessoa" : "Você");
}
