import type { BlocoPergunta, CondicaoExibicao, Cor, Opcao, Pergunta, TipoResposta } from "@/types/orientacao";

/*
 * Questionário do Acolhe+.
 * {voce} / {Voce} são trocados por "você" / "a pessoa" conforme a resposta de PF1.
 */

let cd = 0;
function q(
  cdQueixa: number | null,
  codigo: string,
  nrOrdem: number,
  bloco: BlocoPergunta,
  tipoResposta: TipoResposta,
  dsPergunta: string,
  extra: { cor?: Cor; opcoes?: Opcao[]; cond?: CondicaoExibicao; sinal?: string; alarme?: "SIM" | "NAO" } = {},
): Pergunta {
  return {
    cdPergunta: ++cd,
    cdQueixa,
    codigo,
    dsPergunta,
    nrOrdem,
    bloco,
    tipoResposta,
    dsCorSeSim: extra.cor ?? null,
    ...(extra.alarme ? { dsRespostaAlarme: extra.alarme } : {}),
    ...(extra.opcoes ? { opcoes: extra.opcoes } : {}),
    ...(extra.cond ? { condicaoExibicao: extra.cond } : {}),
    ...(extra.sinal ? { dsSinal: extra.sinal } : {}),
  };
}

const SN = "SIM_NAO" as const;
const SNS = "SIM_NAO_NAOSEI" as const;

const GRIPAL = 1, GARGANTA = 2, DIARREIA = 3, CABECA = 4, URINA = 5;

/*
 * Perguntas de marcar (MULTIPLA): a pessoa marca só o que tem, e cada opção vira um sinal no resultado.
 * "Nenhum destes" e "Não sei" são exclusivas; com só "Não sei", o sinal é o dsSinal da pergunta.
 */
const NENHUM: Opcao = { valor: "NENHUM", rotulo: "Nenhum destes" };
const NAO_SEI_OPCAO: Opcao = { valor: "NAO_SEI", rotulo: "Não sei" };
/** Opções de marcar + "Nenhum destes" (+ "Não sei" nas que aceitavam Não sei). */
const marque = (opcoes: Opcao[], naoSei = false): Opcao[] => [...opcoes, NENHUM, ...(naoSei ? [NAO_SEI_OPCAO] : [])];
const ESTADO_MENTAL: Opcao[] = [
  { valor: "CONFUSO", rotulo: "Confuso" },
  { valor: "SONOLENTO", rotulo: "Muito sonolento" },
  { valor: "DESMAIOU", rotulo: "Desmaiou" },
];
const ALGUM_SINAL = "{Voce} está com algum destes sinais agora?";

export const perguntas: Pergunta[] = [
  // PERFIL (comum)
  q(null, "PF1", 1, "PERFIL", "OPCOES", "Para quem é a orientação?", {
    opcoes: [{ valor: "PARA_MIM", rotulo: "Para mim" }, { valor: "OUTRA_PESSOA", rotulo: "Para outra pessoa" }],
  }),
  q(null, "PF2", 2, "PERFIL", "NUMERO", "Qual a idade?"),
  q(null, "SX", 2.5, "PERFIL", "OPCOES", "Qual o sexo biológico?", {
    opcoes: [{ valor: "F", rotulo: "Feminino" }, { valor: "M", rotulo: "Masculino" }],
  }),
  q(null, "PF3", 3, "PERFIL", "OPCOES", "Está grávida, ou teve bebê ou perdeu uma gestação recentemente?", {
    opcoes: [
      { valor: "GRAVIDA_ATE_5M", rotulo: "Grávida, até 5 meses" },
      { valor: "GRAVIDA_5M_MAIS", rotulo: "Grávida, de 5 meses ou mais" },
      { valor: "POS_PARTO_2SEM", rotulo: "Teve bebê ou perdeu uma gestação há até 2 semanas" },
      { valor: "POS_PARTO_6SEM", rotulo: "Teve bebê há 3 a 6 semanas" },
      { valor: "NAO", rotulo: "Não" },
    ],
    cond: { tipo: "TODAS", condicoes: [{ tipo: "RESPOSTA_EM", codigo: "SX", valores: ["F"] }, { tipo: "IDADE_MAX", valor: 55 }] },
  }),
  q(null, "DOR", 4, "PERFIL", "ESCALA_DOR", "De 0 a 10, qual a nota da dor principal agora? (0 = sem dor)"),

  // INST: uma versão por queixa, perguntando só o que os alarmes anteriores não cobriram.
  q(GRIPAL, "INST", 1000, "LARANJA", SNS, "Além disso, está com tontura forte ou com a pele fria e muito pálida?", { cor: "VERMELHO", sinal: "Tontura forte ou pele fria e muito pálida" }),
  q(DIARREIA, "INST", 1000, "LARANJA", SNS, "Além disso, está com tontura forte, a ponto de quase desmaiar ao ficar de pé?", { cor: "VERMELHO", sinal: "Tontura forte ao ficar de pé" }),

  // SÍNDROME GRIPAL
  q(GRIPAL, "P0", 10, "ENTRADA", "MULTIPLA", "Quais destes sintomas {voce} tem?", {
    opcoes: [
      { valor: "FEBRE", rotulo: "Febre" },
      { valor: "CALAFRIOS", rotulo: "Calafrios" },
      { valor: "GARGANTA", rotulo: "Dor de garganta" },
      { valor: "CABECA", rotulo: "Dor de cabeça" },
      { valor: "TOSSE", rotulo: "Tosse" },
      { valor: "CORIZA", rotulo: "Coriza" },
      { valor: "OLFATO", rotulo: "Perda de olfato ou paladar" },
    ],
  }),
  q(GRIPAL, "P1", 11, "ALARME", SN, "{Voce} tem falta de ar ou cansaço para respirar, mesmo parado?", { cor: "VERMELHO", sinal: "Falta de ar, mesmo parado" }),
  q(GRIPAL, "P2", 12, "ALARME", SN, "{Voce} sente pressão ou dor no peito que não passa?", { cor: "VERMELHO", sinal: "Dor ou pressão no peito" }),
  q(GRIPAL, "P3", 13, "ALARME", SN, "Os lábios ou o rosto estão roxos ou azulados?", { cor: "VERMELHO", sinal: "Lábios ou rosto roxos" }),
  q(GRIPAL, "P4", 14, "ALARME", "MULTIPLA", ALGUM_SINAL, { cor: "VERMELHO", sinal: "Confusão, sonolência ou desmaio", opcoes: marque(ESTADO_MENTAL) }),
  q(GRIPAL, "P5", 15, "LARANJA", SN, "Tem oxímetro e a saturação está abaixo de 95%?", { sinal: "Saturação abaixo de 95%" }),
  q(GRIPAL, "P6", 16, "URGENCIA", SNS, "Tem febre há mais de 3 dias, ou a febre voltou depois de 2 dias sem febre?", { cor: "AMARELO", sinal: "Febre há mais de 3 dias ou que voltou" }),
  q(GRIPAL, "P7", 17, "URGENCIA", "MULTIPLA", ALGUM_SINAL, {
    cor: "AMARELO", sinal: "Urinando pouco ou sem beber líquidos",
    opcoes: marque([
      { valor: "URINA_POUCO", rotulo: "Urinando bem menos" },
      { valor: "BOCA_SECA", rotulo: "Boca muito seca" },
      { valor: "SEM_BEBER", rotulo: "Sem conseguir beber líquidos" },
    ], true),
  }),
  q(GRIPAL, "P8", 18, "URGENCIA", SNS, "Tem doença do pulmão ou do coração que piorou junto com a gripe?", { cor: "AMARELO", sinal: "Doença do pulmão ou coração piorou" }),
  q(GRIPAL, "P8a", 19, "URGENCIA", SNS, "{Voce} está mais irritado ou agitado que o normal?", { cor: "AMARELO", cond: { tipo: "IDADE_MIN", valor: 60 }, sinal: "Mais irritado ou agitado" }),
  q(GRIPAL, "P8b", 20, "URGENCIA", SNS, "{Voce} parou de comer ou está comendo muito menos?", { cor: "AMARELO", cond: { tipo: "IDADE_MIN", valor: 60 }, sinal: "Parou de comer" }),
  // Os valores das doenças são os mesmos códigos da ficha de saúde (CodigoDoencaBase), quando existem.
  q(GRIPAL, "P9", 21, "CLASSIFICACAO", "MULTIPLA", "{Voce} tem alguma destas doenças? (pressão alta sozinha não conta)",
    // Escondida para o grupo de risco da gestação (mesmos valores de grupoRiscoGestacao).
    { cor: "VERDE", opcoes: marque([
      { valor: "PULMAO", rotulo: "Asma ou outra doença do pulmão" },
      { valor: "TUBERCULOSE", rotulo: "Tuberculose" },
      { valor: "CORACAO", rotulo: "Doença do coração" },
      { valor: "DIABETES", rotulo: "Diabetes" },
      { valor: "RINS", rotulo: "Doença dos rins" },
      { valor: "FIGADO", rotulo: "Doença do fígado" },
      { valor: "FALCIFORME", rotulo: "Anemia falciforme" },
      { valor: "IMUNIDADE", rotulo: "Baixa imunidade" },
      { valor: "OBESIDADE", rotulo: "Obesidade grave" },
    ], true), cond: { tipo: "TODAS", condicoes: [
      { tipo: "IDADE_MAX", valor: 59 },
      { tipo: "RESPOSTA_DIFERENTE", codigo: "PF3", valor: "GRAVIDA_ATE_5M" },
      { tipo: "RESPOSTA_DIFERENTE", codigo: "PF3", valor: "GRAVIDA_5M_MAIS" },
      { tipo: "RESPOSTA_DIFERENTE", codigo: "PF3", valor: "POS_PARTO_2SEM" },
    ] } }),

  // DOR DE GARGANTA
  q(GARGANTA, "G0", 30, "ENTRADA", SN, "Além da dor de garganta, {voce} está com tosse ou coriza?"),
  q(GARGANTA, "G1", 31, "ALARME", SN, "Tem dificuldade para respirar ou faz um barulho agudo ao puxar o ar?", { cor: "VERMELHO", sinal: "Dificuldade para respirar" }),
  q(GARGANTA, "G2", 32, "LARANJA", SN, "Consegue engolir a própria saliva?", { alarme: "NAO", cor: "LARANJA", sinal: "Não consegue engolir a saliva" }),
  q(GARGANTA, "G3", 33, "LARANJA", SN, "Tem dificuldade para abrir a boca?", { cor: "LARANJA", sinal: "Dificuldade para abrir a boca" }),
  q(GARGANTA, "G4", 34, "LARANJA", SN, "A voz está abafada, como se falasse com algo quente na boca?", { cor: "LARANJA", sinal: "Voz abafada" }),
  q(GARGANTA, "G5", 35, "LARANJA", SNS, "A dor é muito forte e pior de um lado só, ou há inchaço visível de um lado da garganta?", { cor: "LARANJA", sinal: "Dor forte ou inchaço de um lado" }),
  q(GARGANTA, "G6", 36, "URGENCIA", SNS, "Consegue beber líquidos, mesmo com a dor?", { alarme: "NAO", cor: "AMARELO", sinal: "Não consegue beber líquidos" }),
  q(GARGANTA, "G7", 37, "CLASSIFICACAO", SN, "{Voce} está com febre?", { cor: "VERDE" }),

  // DIARREIA E VÔMITO
  q(DIARREIA, "D1", 43, "LARANJA", "OPCOES",
    "Vomitou sangue (ou algo parecido com borra de café) ou teve fezes com sangue ou pretas como piche?", {
      opcoes: [
        { valor: "HOJE", rotulo: "Sim, hoje" },
        { valor: "ULTIMOS_DIAS", rotulo: "Sim, nos últimos dias" },
        { valor: "NAO", rotulo: "Não" },
        { valor: "NAO_SEI", rotulo: "Não sei" },
      ],
    }),
  q(DIARREIA, "D3a", 41, "ALARME", "MULTIPLA", ALGUM_SINAL, { cor: "VERMELHO", sinal: "Confusão, sonolência ou desmaio", opcoes: marque(ESTADO_MENTAL) }),
  q(DIARREIA, "D3b", 44.5, "LARANJA", SN, "Está sem urinar há muitas horas?", { sinal: "Sem urinar há muitas horas" }),
  q(DIARREIA, "D5", 42, "ALARME", "MULTIPLA", ALGUM_SINAL, {
    cor: "VERMELHO", sinal: "Falta de ar, inchaço ou pele fria",
    opcoes: marque([
      { valor: "FALTA_AR", rotulo: "Falta de ar" },
      { valor: "INCHACO", rotulo: "Inchaço no rosto ou na garganta" },
      { valor: "PELE_FRIA", rotulo: "Pele fria e muito pálida" },
    ]),
  }),
  q(DIARREIA, "D7", 46, "URGENCIA", SNS, "Vomita tudo o que bebe?", { cor: "AMARELO", sinal: "Vomita tudo o que bebe" }),
  q(DIARREIA, "D8", 47, "URGENCIA", "MULTIPLA", ALGUM_SINAL, {
    cor: "AMARELO", sinal: "Sinais de desidratação",
    opcoes: marque([
      { valor: "SEDE", rotulo: "Muita sede" },
      { valor: "BOCA_SECA", rotulo: "Boca seca" },
      { valor: "OLHOS_FUNDOS", rotulo: "Olhos fundos" },
      { valor: "URINA_POUCO", rotulo: "Urinando bem menos" },
    ], true),
  }),
  q(DIARREIA, "D10", 48, "URGENCIA", SNS, "Consegue repor os líquidos bebendo, mesmo com a diarreia?", { alarme: "NAO", cor: "AMARELO", sinal: "Diarreia sem conseguir repor líquidos" }),
  q(DIARREIA, "D11", 49, "URGENCIA", SNS, "{Voce} tem diabetes?"),
  q(DIARREIA, "D11a", 50, "URGENCIA", "MULTIPLA", "Com a diabetes, {voce} tem algum destes?", {
    cor: "AMARELO", cond: { tipo: "RESPOSTA_EM", codigo: "D11", valores: ["SIM", "NAO_SEI"] }, sinal: "Diabetes com insulina, fraqueza ou dor",
    opcoes: marque([
      { valor: "INSULINA", rotulo: "Usa insulina", sinal: "Diabetes com uso de insulina" },
      { valor: "FRAQUEZA", rotulo: "Fraqueza", sinal: "Diabetes com fraqueza" },
      { valor: "DOR_BARRIGA", rotulo: "Dor na barriga", sinal: "Diabetes com dor na barriga" },
    ], true),
  }),
  q(DIARREIA, "D12", 51, "CLASSIFICACAO", SN, "A diarreia dura 14 dias ou mais?", { cor: "VERDE" }),
  q(DIARREIA, "D13", 52, "CLASSIFICACAO", "MULTIPLA", "{Voce} tem algum destes?", {
    cor: "VERDE",
    opcoes: marque([{ valor: "FEBRE", rotulo: "Febre" }, { valor: "MUCO_PUS", rotulo: "Muco ou pus nas fezes" }]),
  }),

  // DOR DE CABEÇA
  q(CABECA, "C1", 61, "ALARME", SN, "A dor começou de repente, muito forte, como a pior da vida?", { cor: "VERMELHO", sinal: "Dor súbita, a pior da vida" }),
  q(CABECA, "C2", 62, "ALARME", "MULTIPLA", ALGUM_SINAL, {
    cor: "VERMELHO", sinal: "Febre com nuca dura ou manchas roxas",
    opcoes: marque([
      { valor: "NUCA", rotulo: "Febre com nuca dura (não consegue encostar o queixo no peito)", sinal: "Febre com nuca dura" },
      { valor: "MANCHAS", rotulo: "Manchas roxas na pele" },
    ]),
  }),
  q(CABECA, "C3", 63, "ALARME", "MULTIPLA", ALGUM_SINAL, {
    cor: "VERMELHO", sinal: "Fraqueza de um lado, fala enrolada ou confusão",
    opcoes: marque([
      { valor: "FRAQUEZA_LADO", rotulo: "Fraqueza ou dormência de um lado do corpo" },
      { valor: "FALA", rotulo: "Fala enrolada" },
      { valor: "BOCA", rotulo: "Boca torta" },
      { valor: "VISAO", rotulo: "Perda de visão" },
      { valor: "CONFUSAO", rotulo: "Confusão" },
    ]),
  }),
  q(CABECA, "C4", 64, "ALARME", SN, "Teve convulsão?", { cor: "VERMELHO", sinal: "Convulsão" }),
  q(CABECA, "C5", 65, "LARANJA", SN, "A dor começou depois de uma batida na cabeça?", { cor: "LARANJA", sinal: "Dor depois de batida na cabeça" }),
  q(CABECA, "C6", 66, "URGENCIA", SNS, "A dor melhorou com o remédio que já tomou?", { alarme: "NAO", cor: "AMARELO", cond: { tipo: "DOR_MIN", valor: 8 }, sinal: "Dor forte que não melhora com remédio" }),
  q(CABECA, "C7", 67, "URGENCIA", SNS, "Tem vômitos em jato, sem enjoo antes?", { cor: "AMARELO", sinal: "Vômitos em jato" }),
  q(CABECA, "C8", 68, "URGENCIA", SNS, "A dor é diferente das que costuma ter, ou está piorando nas últimas semanas?", { cor: "AMARELO", sinal: "Dor diferente ou piorando" }),
  q(CABECA, "C9", 69, "URGENCIA", SNS, "É a primeira vez com uma dor assim?", { cor: "AMARELO", cond: { tipo: "IDADE_MIN", valor: 50 }, sinal: "Primeira dor assim após os 50" }),
  q(CABECA, "C11", 71, "CLASSIFICACAO", SN, "{Voce} está com febre?", { cor: "VERDE" }),

  // ARDÊNCIA AO URINAR
  q(URINA, "U1", 81, "ALARME", "MULTIPLA", ALGUM_SINAL, {
    cor: "VERMELHO", sinal: "Confusão, desmaio ou pele fria",
    opcoes: marque([...ESTADO_MENTAL, { valor: "PELE_FRIA", rotulo: "Pele fria e pálida, com muita fraqueza" }]),
  }),
  q(URINA, "U2", 82, "URGENCIA", SNS, "Tem dor nas costas, na altura da cintura, de um lado só?", { sinal: "Dor nas costas de um lado" }),
  q(URINA, "U3", 83, "URGENCIA", SN, "{Voce} está com febre?", { sinal: "Febre" }),
  q(URINA, "U4", 84, "URGENCIA", SNS, "Está vomitando a ponto de não conseguir beber líquidos ou tomar remédio?", { cor: "AMARELO", sinal: "Vômitos que impedem beber líquidos" }),
  q(URINA, "U7", 86, "CLASSIFICACAO", "MULTIPLA", "{Voce} tem algum destes?", {
    cor: "VERDE",
    opcoes: marque([
      { valor: "DIABETES", rotulo: "Diabetes" },
      { valor: "IMUNIDADE", rotulo: "Baixa imunidade" },
      { valor: "SONDA", rotulo: "Usa sonda para urinar" },
    ], true),
  }),
];
