import { describe, expect, it } from "vitest";
import {
  alarmeGestacaoCabeca, alternarOpcao, calcularOrientacao, grupoRiscoGestacao, iniciarQuestionario, perguntasDaQueixa, podeContinuar,
  proximoPasso, responderNoQuestionario, trocarQueixaNoQuestionario, voltarNoQuestionario,
} from "./regrasOrientacao";
import { perguntas } from "@/data/perguntas";
import type { CodigoQueixa, Cor, Pergunta, Respostas } from "@/types/orientacao";

const perfil = (extra: Respostas = {}): Respostas => ({ PF1: "PARA_MIM", PF2: 30, SX: "F", PF3: "NAO", DOR: 2, ...extra });
/** Resposta "Nenhum destes" das perguntas de marcar. */
const N = ["NENHUM"];

describe("Síndrome gripal", () => {
  it("VERMELHO/SAMU com falta de ar", () => {
    const r = calcularOrientacao("GRIPAL", perfil({ P1: "SIM" }));
    expect(r).toMatchObject({ dsCor: "VERMELHO", dsDestino: "SAMU" });
  });
  it("AMARELO/UPA com 'Não sei' na febre prolongada (pior caso)", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ P1: "NAO", P6: "NAO_SEI" })).dsCor).toBe("AMARELO");
  });
  it("VERDE direto para 60+", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ PF2: 65 })).dsCor).toBe("VERDE");
  });
  it("VERDE com comorbidade; sem comorbidade, febre na P0 decide VERDE ou AZUL", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ P9: ["DIABETES"] })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("GRIPAL", perfil({ P0: ["FEBRE", "TOSSE"], P9: N })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("GRIPAL", perfil({ P0: ["TOSSE", "CORIZA"], P9: N }))).toMatchObject({ dsCor: "AZUL", dsDestino: "UBS" });
  });
  it("não pergunta febre de novo depois da P9", () => {
    const r = perfil({ P0: ["TOSSE", "CORIZA"], P1: "NAO", P2: "NAO", P3: "NAO", P4: N, P5: "NAO", P6: "NAO", P7: N, P8: "NAO", P9: N });
    expect(proximoPasso("GRIPAL", r).tipo).toBe("RESULTADO");
  });
  it("menor de 18 encerra o fluxo", () => {
    expect(proximoPasso("GRIPAL", { PF1: "PARA_MIM", PF2: 15 }).tipo).toBe("MENOR_IDADE");
  });
});

describe("Dor de garganta", () => {
  it("LARANJA ao não engolir saliva", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G2: "NAO" })).dsCor).toBe("LARANJA");
  });
  it("LARANJA/PRONTO_SOCORRO com G5 = Sim", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G5: "SIM" }))).toMatchObject({ dsCor: "LARANJA", dsDestino: "PRONTO_SOCORRO" });
  });
  it("exceção do G5: 'Não sei' leva a AMARELO, não a LARANJA", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G3: "NAO", G4: "NAO", G5: "NAO_SEI" })).dsCor).toBe("AMARELO");
  });
  it("VERDE com febre, AZUL sem febre", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G7: "SIM" })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("GARGANTA", perfil({ G7: "NAO" })).dsCor).toBe("AZUL");
  });
});

describe("Diarreia e vômito", () => {
  it("LARANJA com dor 8 e sem instabilidade", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ DOR: 8, INST: "NAO" })).dsCor).toBe("LARANJA");
  });
  it("AMARELO com dor 6", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ DOR: 6 })).dsCor).toBe("AMARELO");
  });
  it("AMARELO com diabetes e insulina", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D11: "SIM", D11a: ["INSULINA"] })).dsCor).toBe("AMARELO");
  });
  it("D1 = Sim, hoje: LARANJA (sem instabilidade) com o sinal de sangue hoje", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D1: "HOJE", INST: "NAO" }))).toMatchObject({
      dsCor: "LARANJA",
      sinaisMarcados: ["Sangue no vômito ou nas fezes hoje"],
    });
  });
  it("D1 = Sim, nos últimos dias: AMARELO com o sinal de sangue recente", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D1: "ULTIMOS_DIAS" }))).toMatchObject({
      dsCor: "AMARELO",
      sinaisMarcados: ["Sangue nos últimos dias"],
    });
  });
  it("exceção da D1: 'Não sei' leva a AMARELO, não a LARANJA", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D1: "NAO_SEI" }))).toMatchObject({
      dsCor: "AMARELO",
      sinaisMarcados: ["Sangue nos últimos dias"],
    });
    expect(proximoPasso("DIARREIA", perfil({ D3a: N, D5: N, D1: "NAO_SEI", D3b: "NAO" })))
      .toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D7" } });
  });
  it("D1 = Não: AZUL sem sinais", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D1: "NAO" }))).toMatchObject({ dsCor: "AZUL", sinaisMarcados: [] });
  });
  it("sangue nos últimos dias não pede INST, mas D3b ainda leva ao caminho laranja", () => {
    const r = perfil({ D3a: N, D5: N, D1: "ULTIMOS_DIAS" });
    expect(proximoPasso("DIARREIA", { ...r, D3b: "NAO" })).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D7" } });
    expect(proximoPasso("DIARREIA", { ...r, D3b: "SIM" })).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "INST" } });
    expect(calcularOrientacao("DIARREIA", { ...r, D3b: "SIM", INST: "NAO" }).dsCor).toBe("LARANJA");
  });
  it("VERDE com 14 dias ou mais, AZUL sem nada", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D12: "SIM" })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("DIARREIA", perfil({ D12: "NAO", D13: N })).dsCor).toBe("AZUL");
  });
});

describe("Dor de cabeça", () => {
  it("VERMELHO com convulsão", () => {
    expect(calcularOrientacao("CABECA", perfil({ C4: "SIM" })).dsCor).toBe("VERMELHO");
  });
  it("LARANJA após batida na cabeça", () => {
    expect(calcularOrientacao("CABECA", perfil({ C5: "SIM" })).dsCor).toBe("LARANJA");
  });
  it("AMARELO com vômitos em jato", () => {
    expect(calcularOrientacao("CABECA", perfil({ C7: "SIM" })).dsCor).toBe("AMARELO");
  });
  it("VERDE com dor 6, AZUL com dor 2 sem febre", () => {
    expect(calcularOrientacao("CABECA", perfil({ DOR: 6 })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("CABECA", perfil({ C11: "NAO" })).dsCor).toBe("AZUL");
  });
});

describe("Ardência ao urinar", () => {
  const base = perfil({ U7: N });
  it("VERMELHO com confusão", () => {
    expect(calcularOrientacao("URINA", perfil({ U1: ["CONFUSO"] })).dsCor).toBe("VERMELHO");
  });
  it("regra combinada: U2 + U3 = AMARELO", () => {
    expect(calcularOrientacao("URINA", { ...base, U2: "SIM", U3: "SIM" }).dsCor).toBe("AMARELO");
    expect(calcularOrientacao("URINA", { ...base, U2: "NAO_SEI", U3: "SIM" }).dsCor).toBe("AMARELO");
  });
  it("U2 sem febre não leva a AMARELO", () => {
    expect(calcularOrientacao("URINA", { ...base, U2: "SIM", U3: "NAO" }).dsCor).toBe("AZUL");
  });
  it("VERDE para sexo masculino, AZUL para mulher jovem sem riscos", () => {
    expect(calcularOrientacao("URINA", { ...base, U2: "NAO", U3: "NAO", SX: "M" }).dsCor).toBe("VERDE");
    expect(calcularOrientacao("URINA", { ...base, U2: "NAO", U3: "NAO", U4: "NAO" }).dsCor).toBe("AZUL");
  });
});

describe("Perfil: sexo e gestação", () => {
  const VALORES_PF3 = ["GRAVIDA_ATE_5M", "GRAVIDA_5M_MAIS", "POS_PARTO_2SEM", "POS_PARTO_6SEM", "NAO", undefined];
  it.each([
    ["GRAVIDA_ATE_5M", true, false],
    ["GRAVIDA_5M_MAIS", true, true],
    ["POS_PARTO_2SEM", true, true],
    ["POS_PARTO_6SEM", false, true],
    ["NAO", false, false],
    [undefined, false, false],
  ] as const)("PF3 = %s → grupoRisco %s, alarmeCabeca %s", (pf3, risco, alarme) => {
    const r = perfil({ PF3: pf3 as string });
    if (pf3 === undefined) delete r["PF3"];
    expect(grupoRiscoGestacao(r)).toBe(risco);
    expect(alarmeGestacaoCabeca(r)).toBe(alarme);
  });

  it("grupo de risco leva a VERDE na gripe e na urina", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ PF3: "GRAVIDA_ATE_5M" })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("GRIPAL", perfil({ PF3: "POS_PARTO_6SEM", P9: N })).dsCor).toBe("AZUL");
    const urina = perfil({ U2: "NAO", U3: "NAO", U4: "NAO", U7: N });
    expect(calcularOrientacao("URINA", { ...urina, PF3: "POS_PARTO_2SEM" }).dsCor).toBe("VERDE");
    expect(calcularOrientacao("URINA", { ...urina, PF3: "POS_PARTO_6SEM" }).dsCor).toBe("AZUL");
  });

  it("gravidez avançada ou pós-parto leva a AMARELO na dor de cabeça", () => {
    expect(calcularOrientacao("CABECA", perfil({ PF3: "POS_PARTO_6SEM" }))).toMatchObject({
      dsCor: "AMARELO",
      sinaisMarcados: ["Gravidez avançada ou pós-parto"],
    });
    expect(calcularOrientacao("CABECA", perfil({ PF3: "GRAVIDA_ATE_5M", C11: "NAO" })).dsCor).toBe("AZUL");
  });

  it("PF3 aparece depois da SX só para mulheres até 55 anos", () => {
    const base = { PF1: "PARA_MIM", PF2: 30 };
    expect(proximoPasso("GRIPAL", base)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "SX" } });
    expect(proximoPasso("GRIPAL", { ...base, SX: "F" })).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "PF3" } });
    expect(proximoPasso("GRIPAL", { ...base, PF2: 55, SX: "F" })).toMatchObject({ pergunta: { codigo: "PF3" } });
    expect(proximoPasso("GRIPAL", { ...base, PF2: 56, SX: "F" })).toMatchObject({ pergunta: { codigo: "DOR" } });
    expect(proximoPasso("GRIPAL", { ...base, SX: "M" })).toMatchObject({ pergunta: { codigo: "DOR" } });
  });

  it.each(VALORES_PF3)("P9 fica escondida exatamente para o grupo de risco (PF3 = %s)", (pf3) => {
    const r = perfil({ P0: ["FEBRE", "TOSSE"], P1: "NAO", P2: "NAO", P3: "NAO", P4: N, P5: "NAO", P6: "NAO", P7: N, P8: "NAO" });
    if (pf3 === undefined) {
      // PF3 não perguntada (sexo masculino).
      delete r["PF3"];
      r["SX"] = "M";
    } else r["PF3"] = pf3;
    const passo = proximoPasso("GRIPAL", r);
    if (grupoRiscoGestacao(r)) expect(passo.tipo).toBe("RESULTADO");
    else expect(passo).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "P9" } });
  });
});


describe("Instabilidade e prioridade dos alarmes", () => {
  it("G1 permanece VERMELHO", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G1: "SIM" }))).toMatchObject({ dsCor: "VERMELHO", dsDestino: "SAMU" });
  });
  it.each(["NAO", "SIM", "NAO_SEI"])("P5 com INST = %s", (inst) => {
    expect(calcularOrientacao("GRIPAL", perfil({ P5: "SIM", INST: inst }))).toMatchObject({
      dsCor: inst === "NAO" ? "LARANJA" : "VERMELHO",
      dsDestino: inst === "NAO" ? "PRONTO_SOCORRO" : "SAMU",
    });
  });
  it("P1 prevalece sobre P5 estável", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ P1: "SIM", P5: "SIM", INST: "NAO" })).dsCor).toBe("VERMELHO");
    const codigos = perguntasDaQueixa("GRIPAL").map((p) => p.codigo);
    expect(codigos.indexOf("P1")).toBeLessThan(codigos.indexOf("P5"));
  });
  const sinais: Respostas[] = [{ D1: "HOJE" }, { D3b: "SIM" }, { DOR: 8 }, { DOR: 9 }, { DOR: 10 }];
  for (const sinal of sinais) {
    it.each(["NAO", "SIM", "NAO_SEI"])(`diarreia ${JSON.stringify(sinal)} com INST = %s`, (inst) => {
      expect(calcularOrientacao("DIARREIA", perfil({ ...sinal, INST: inst }))).toMatchObject({
        dsCor: inst === "NAO" ? "LARANJA" : "VERMELHO",
        dsDestino: inst === "NAO" ? "PRONTO_SOCORRO" : "SAMU",
      });
    });
  }
  it("D3a permanece VERMELHO", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D3a: ["DESMAIOU"] })).dsCor).toBe("VERMELHO");
  });
  it("D5 prevalece sobre dor intensa estável", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ DOR: 10, D5: ["FALTA_AR"], INST: "NAO" })).dsCor).toBe("VERMELHO");
  });
  it.each([
    ["GRIPAL", { P6: "SIM", P7: ["BOCA_SECA"], P8: "NAO_SEI" }],
    ["GARGANTA", { G5: "NAO_SEI", G6: "NAO" }],
    ["DIARREIA", { D1: "ULTIMOS_DIAS", D7: "SIM", D8: ["SEDE"] }],
    ["CABECA", { C7: "SIM", C8: "SIM" }],
    ["URINA", { U2: "SIM", U3: "SIM", U4: "SIM" }],
  ] as [CodigoQueixa, Respostas][])("vários sinais amarelos em %s não elevam a cor", (queixa, respostas) => {
    expect(calcularOrientacao(queixa, perfil(respostas)).dsCor).toBe("AMARELO");
  });

  it("dor intensa não interrompe os alarmes vermelhos da diarreia", () => {
    const r = perfil({ DOR: 8 });
    expect(proximoPasso("DIARREIA", r)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D3a" } });
    expect(proximoPasso("DIARREIA", { ...r, D3a: N })).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D5" } });
    expect(proximoPasso("DIARREIA", { ...r, D3a: N, D5: ["FALTA_AR"] }).tipo).toBe("RESULTADO");
  });
  it.each(["GRIPAL", "DIARREIA"] as const)("%s pergunta INST após os laranjas e termina", (queixa) => {
    const r = queixa === "GRIPAL"
      ? perfil({ P0: ["FEBRE", "TOSSE"], P1: "NAO", P2: "NAO", P3: "NAO", P4: N, P5: "SIM" })
      : perfil({ D3a: N, D5: N, D1: "HOJE", D3b: "NAO" });
    expect(proximoPasso(queixa, r)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "INST" } });
    for (const inst of ["NAO", "SIM", "NAO_SEI"]) expect(proximoPasso(queixa, { ...r, INST: inst }).tipo).toBe("RESULTADO");
  });
  it.each([
    ["GRIPAL", perfil({ P0: ["FEBRE", "TOSSE"], P1: "NAO", P2: "NAO", P3: "NAO", P4: N, P5: "SIM" }),
      "Além disso, está com tontura forte ou com a pele fria e muito pálida?", "Tontura forte ou pele fria e muito pálida"],
    ["DIARREIA", perfil({ D3a: N, D5: N, D1: "HOJE", D3b: "NAO" }),
      "Além disso, está com tontura forte, a ponto de quase desmaiar ao ficar de pé?", "Tontura forte ao ficar de pé"],
  ] as const)("%s usa o texto e o sinal próprios da INST", (queixa, r, texto, sinalInst) => {
    expect(proximoPasso(queixa, r)).toMatchObject({ pergunta: { codigo: "INST", dsPergunta: texto } });
    expect(calcularOrientacao(queixa, { ...r, INST: "SIM" }).sinaisMarcados).toContain(sinalInst);
  });
  it.each(["GRIPAL", "GARGANTA", "DIARREIA", "CABECA", "URINA"] as const)("códigos únicos nas perguntas de %s", (queixa) => {
    const codigos = perguntasDaQueixa(queixa).map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
  it("INST não aparece sem sinal elegível", () => {
    expect(proximoPasso("DIARREIA", perfil({ D3a: N, D5: N, D1: "NAO", D3b: "NAO" })))
      .toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D7" } });
  });
  it.each(["G2", "G3", "G4", "G5"])("%s termina sem INST", (codigo) => {
    expect(proximoPasso("GARGANTA", perfil({ G0: "NAO", G1: "NAO", [codigo]: codigo === "G2" ? "NAO" : "SIM" })).tipo).toBe("RESULTADO");
  });
  it("C5 termina sem INST", () => {
    expect(proximoPasso("CABECA", perfil({ C1: "NAO", C2: N, C3: N, C4: "NAO", C5: "SIM" })).tipo).toBe("RESULTADO");
  });
});


describe("perguntas de marcar", () => {
  const pergunta = (codigo: string): Pergunta => perguntas.find((p) => p.codigo === codigo)!;
  const EXCLUSIVAS = ["NENHUM", "NAO_SEI"];
  /** Queixa, código, respostas de contexto e a cor quando uma opção de sinal é marcada. */
  const CASOS: [CodigoQueixa, string, Respostas, Cor][] = [
    ["GRIPAL", "P4", {}, "VERMELHO"],
    ["DIARREIA", "D3a", {}, "VERMELHO"],
    ["URINA", "U1", {}, "VERMELHO"],
    ["CABECA", "C3", {}, "VERMELHO"],
    ["CABECA", "C2", {}, "VERMELHO"],
    ["DIARREIA", "D5", {}, "VERMELHO"],
    ["GRIPAL", "P7", {}, "AMARELO"],
    ["DIARREIA", "D8", {}, "AMARELO"],
    ["DIARREIA", "D11a", { D11: "SIM" }, "AMARELO"],
    ["DIARREIA", "D13", {}, "VERDE"],
    ["GRIPAL", "P9", { P0: ["TOSSE", "CORIZA"] }, "VERDE"],
    ["URINA", "U7", {}, "VERDE"],
  ];
  // P9, U7 e D13 só decidem VERDE/AZUL e não geram sinais.
  const geraSinais = (cor: Cor) => cor === "VERMELHO" || cor === "AMARELO";

  it("os casos cobrem todas as perguntas de marcar com 'Nenhum destes'", () => {
    const comNenhum = perguntas.filter((p) => p.tipoResposta === "MULTIPLA" && p.opcoes?.some((o) => o.valor === "NENHUM"));
    expect(comNenhum.map((p) => p.codigo).sort()).toEqual(CASOS.map(([, c]) => c).sort());
    expect(pergunta("P0").opcoes?.some((o) => o.valor === "NENHUM")).toBe(false);
  });

  const porOpcao = CASOS.flatMap(([queixa, codigo, contexto, cor]) =>
    (pergunta(codigo).opcoes ?? []).filter((o) => !EXCLUSIVAS.includes(o.valor))
      .map((o) => [queixa, codigo, o.valor, o.sinal ?? o.rotulo, contexto, cor] as const));
  it.each(porOpcao)("%s %s = [%s] marca o sinal \"%s\"", (queixa, codigo, valor, sinalOpcao, contexto, cor) => {
    expect(calcularOrientacao(queixa, perfil({ ...contexto, [codigo]: [valor] }))).toMatchObject({
      dsCor: cor,
      sinaisMarcados: geraSinais(cor) ? [sinalOpcao] : [],
    });
  });

  it.each(CASOS)("%s %s = Nenhum destes não é alarme", (queixa, codigo, contexto) => {
    expect(calcularOrientacao(queixa, perfil({ ...contexto, [codigo]: N }))).toMatchObject({ dsCor: "AZUL", sinaisMarcados: [] });
  });

  it("várias opções marcadas listam um sinal por opção, sem mudar a cor", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ P4: ["CONFUSO", "DESMAIOU"] }))).toMatchObject({
      dsCor: "VERMELHO", sinaisMarcados: ["Confuso", "Desmaiou"],
    });
    expect(calcularOrientacao("DIARREIA", perfil({ D8: ["SEDE", "OLHOS_FUNDOS"] }))).toMatchObject({
      dsCor: "AMARELO", sinaisMarcados: ["Muita sede", "Olhos fundos"],
    });
  });

  it("só as perguntas que aceitavam 'Não sei' têm essa opção", () => {
    const comNaoSei = CASOS.map(([, c]) => c).filter((c) => pergunta(c).opcoes?.some((o) => o.valor === "NAO_SEI"));
    expect(comNaoSei.sort()).toEqual(["D11a", "D8", "P7", "P9", "U7"]);
  });

  it.each(CASOS.filter(([, c]) => pergunta(c).opcoes?.some((o) => o.valor === "NAO_SEI")))(
    "%s %s = Não sei vale como pior caso, com o sinal geral da pergunta", (queixa, codigo, contexto, cor) => {
      expect(calcularOrientacao(queixa, perfil({ ...contexto, [codigo]: ["NAO_SEI"] }))).toMatchObject({
        dsCor: cor,
        sinaisMarcados: geraSinais(cor) ? [pergunta(codigo).dsSinal] : [],
      });
    });

  describe("alternarOpcao", () => {
    it("marca e desmarca opções de sinal", () => {
      expect(alternarOpcao([], "CONFUSO")).toEqual(["CONFUSO"]);
      expect(alternarOpcao(["CONFUSO"], "DESMAIOU")).toEqual(["CONFUSO", "DESMAIOU"]);
      expect(alternarOpcao(["CONFUSO", "DESMAIOU"], "CONFUSO")).toEqual(["DESMAIOU"]);
    });
    it.each(EXCLUSIVAS)("%s desmarca todas as outras", (exclusiva) => {
      expect(alternarOpcao(["CONFUSO", "DESMAIOU"], exclusiva)).toEqual([exclusiva]);
    });
    it("NENHUM e NAO_SEI se excluem", () => {
      expect(alternarOpcao(["NENHUM"], "NAO_SEI")).toEqual(["NAO_SEI"]);
      expect(alternarOpcao(["NAO_SEI"], "NENHUM")).toEqual(["NENHUM"]);
    });
    it.each(EXCLUSIVAS)("marcar um sinal desmarca %s", (exclusiva) => {
      expect(alternarOpcao([exclusiva], "CONFUSO")).toEqual(["CONFUSO"]);
    });
  });

  describe("podeContinuar", () => {
    it.each(CASOS.map(([, c]) => c))("%s exige pelo menos uma escolha", (codigo) => {
      expect(podeContinuar(pergunta(codigo), [])).toBe(false);
      expect(podeContinuar(pergunta(codigo), ["NENHUM"])).toBe(true);
    });
    it("a P0 continua aceitando nada marcado", () => {
      expect(podeContinuar(pergunta("P0"), [])).toBe(true);
    });
  });
});

describe("perguntas positivas preservam o significado clínico", () => {
  it.each([
    ["GARGANTA", "G2", "LARANJA"],
    ["GARGANTA", "G6", "AMARELO"],
    ["CABECA", "C6", "AMARELO"],
    ["DIARREIA", "D10", "AMARELO"],
  ] as const)("%s %s Não é alarme, Sim não é", (queixa, codigo, cor) => {
    const base = perfil(queixa === "CABECA" ? { DOR: 8 } : {});
    expect(calcularOrientacao(queixa, { ...base, [codigo]: "NAO" }).dsCor).toBe(cor);
    expect(calcularOrientacao(queixa, { ...base, [codigo]: "SIM" }).dsCor).toBe("AZUL");
  });
  it.each([["GARGANTA", "G6"], ["CABECA", "C6"], ["DIARREIA", "D10"]] as const)("%s %s Não sei mantém pior caso", (queixa, codigo) => {
    expect(calcularOrientacao(queixa, perfil({ DOR: queixa === "CABECA" ? 8 : 2, [codigo]: "NAO_SEI" })).dsCor).toBe("AMARELO");
  });
  it("C6 permanece oculta abaixo de dor 8", () => {
    expect(proximoPasso("CABECA", perfil({ C1: "NAO", C2: N, C3: N, C4: "NAO", C5: "NAO" }))).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "C7" } });
  });
});

describe("Estado do questionário", () => {
  const novo = () => iniciarQuestionario("GARGANTA", "01310-100", { nrEndereco: "10" });

  it("começa vazio, com CEP e local", () => {
    expect(novo()).toEqual({ cdQueixa: "GARGANTA", nrCep: "01310-100", nrEndereco: "10", respostas: {}, ordem: [], resultado: null });
  });

  it("responder grava a resposta sem repetir a pergunta na ordem", () => {
    let o = responderNoQuestionario(novo(), "PF2", 30);
    o = responderNoQuestionario(o, "PF2", 31);
    expect(o.respostas).toEqual({ PF2: 31 });
    expect(o.ordem).toEqual(["PF2"]);
  });

  it("voltar desfaz só a última resposta e não muda nada sem respostas", () => {
    const vazio = novo();
    expect(voltarNoQuestionario(vazio)).toBe(vazio);
    const o = voltarNoQuestionario(responderNoQuestionario(responderNoQuestionario(vazio, "PF1", "PARA_MIM"), "G0", "NAO"));
    expect(o.respostas).toEqual({ PF1: "PARA_MIM" });
    expect(o.ordem).toEqual(["PF1"]);
  });

  it("trocar de queixa mantém só o perfil e limpa o resultado", () => {
    let o = novo();
    for (const [c, v] of Object.entries({ PF1: "PARA_MIM", PF2: 30, SX: "F", PF3: "NAO", DOR: 3, G0: "SIM" })) o = responderNoQuestionario(o, c, v);
    const t = trocarQueixaNoQuestionario(o, "GRIPAL");
    expect(t.cdQueixa).toBe("GRIPAL");
    expect(t.respostas).toEqual({ PF1: "PARA_MIM", PF2: 30, SX: "F", PF3: "NAO", DOR: 3 });
    expect(t.ordem).toEqual(["PF1", "PF2", "SX", "PF3", "DOR"]);
    expect(t.resultado).toBeNull();
  });

  it("não altera o objeto original (o balcão e o app guardam estados separados)", () => {
    const o = novo();
    responderNoQuestionario(o, "PF2", 30);
    expect(o.respostas).toEqual({});
  });
});
