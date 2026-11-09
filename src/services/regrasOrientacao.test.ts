import { describe, expect, it } from "vitest";
import {
  alarmeGestacaoCabeca, calcularOrientacao, grupoRiscoGestacao, perguntasDaQueixa, proximoPasso,
} from "./regrasOrientacao";
import type { CodigoQueixa, Respostas } from "@/types/orientacao";

const perfil = (extra: Respostas = {}): Respostas => ({ PF1: "PARA_MIM", PF2: 30, SX: "F", PF3: "NAO", DOR: 2, ...extra });

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
  it("VERDE com comorbidade, AZUL sem febre", () => {
    expect(calcularOrientacao("GRIPAL", perfil({ P9: "SIM" })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("GRIPAL", perfil({ P9: "NAO", P10: "NAO" }))).toMatchObject({ dsCor: "AZUL", dsDestino: "UBS" });
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
    expect(calcularOrientacao("DIARREIA", perfil({ D11: "SIM", D11a: "SIM" })).dsCor).toBe("AMARELO");
  });
  it("VERDE com 14 dias ou mais, AZUL sem nada", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D12: "SIM" })).dsCor).toBe("VERDE");
    expect(calcularOrientacao("DIARREIA", perfil({ D12: "NAO", D13: "NAO" })).dsCor).toBe("AZUL");
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
  const base = perfil({ U7: "NAO" });
  it("VERMELHO com confusão", () => {
    expect(calcularOrientacao("URINA", perfil({ U1: "SIM" })).dsCor).toBe("VERMELHO");
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
    expect(calcularOrientacao("GRIPAL", perfil({ PF3: "POS_PARTO_6SEM", P9: "NAO", P10: "NAO" })).dsCor).toBe("AZUL");
    const urina = perfil({ U2: "NAO", U3: "NAO", U4: "NAO", U7: "NAO" });
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
    const r = perfil({ P0: ["FEBRE", "TOSSE"], P1: "NAO", P2: "NAO", P3: "NAO", P4: "NAO", P5: "NAO", P6: "NAO", P7: "NAO", P8: "NAO" });
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
  const sinais: Respostas[] = [{ D1: "SIM" }, { D2: "SIM" }, { D3b: "SIM" }, { DOR: 8 }, { DOR: 9 }, { DOR: 10 }];
  for (const sinal of sinais) {
    it.each(["NAO", "SIM", "NAO_SEI"])(`diarreia ${JSON.stringify(sinal)} com INST = %s`, (inst) => {
      expect(calcularOrientacao("DIARREIA", perfil({ ...sinal, INST: inst }))).toMatchObject({
        dsCor: inst === "NAO" ? "LARANJA" : "VERMELHO",
        dsDestino: inst === "NAO" ? "PRONTO_SOCORRO" : "SAMU",
      });
    });
  }
  it("D3a permanece VERMELHO", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ D3a: "SIM" })).dsCor).toBe("VERMELHO");
  });
  it("D5 prevalece sobre dor intensa estável", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ DOR: 10, D5: "SIM", INST: "NAO" })).dsCor).toBe("VERMELHO");
  });
  it.each([
    ["GRIPAL", { P6: "SIM", P7: "SIM", P8: "NAO_SEI" }],
    ["GARGANTA", { G5: "NAO_SEI", G6: "NAO" }],
    ["DIARREIA", { D6: "SIM", D7: "SIM", D8: "SIM" }],
    ["CABECA", { C7: "SIM", C8: "SIM" }],
    ["URINA", { U2: "SIM", U3: "SIM", U4: "SIM" }],
  ] as [CodigoQueixa, Respostas][])("vários sinais amarelos em %s não elevam a cor", (queixa, respostas) => {
    expect(calcularOrientacao(queixa, perfil(respostas)).dsCor).toBe("AMARELO");
  });

  it("dor intensa não interrompe os alarmes vermelhos da diarreia", () => {
    const r = perfil({ DOR: 8 });
    expect(proximoPasso("DIARREIA", r)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D3a" } });
    expect(proximoPasso("DIARREIA", { ...r, D3a: "NAO" })).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D5" } });
    expect(proximoPasso("DIARREIA", { ...r, D3a: "NAO", D5: "SIM" }).tipo).toBe("RESULTADO");
  });
  it.each(["GRIPAL", "DIARREIA"] as const)("%s pergunta INST após os laranjas e termina", (queixa) => {
    const r = queixa === "GRIPAL"
      ? perfil({ P0: ["FEBRE", "TOSSE"], P1: "NAO", P2: "NAO", P3: "NAO", P4: "NAO", P5: "SIM" })
      : perfil({ D3a: "NAO", D5: "NAO", D1: "SIM", D2: "NAO", D3b: "NAO" });
    expect(proximoPasso(queixa, r)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "INST" } });
    for (const inst of ["NAO", "SIM", "NAO_SEI"]) expect(proximoPasso(queixa, { ...r, INST: inst }).tipo).toBe("RESULTADO");
  });
  it("INST não aparece sem sinal elegível", () => {
    expect(proximoPasso("DIARREIA", perfil({ D3a: "NAO", D5: "NAO", D1: "NAO", D2: "NAO", D3b: "NAO" })))
      .toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "D6" } });
  });
  it.each(["G2", "G3", "G4", "G5"])("%s termina sem INST", (codigo) => {
    expect(proximoPasso("GARGANTA", perfil({ G0: "NAO", G1: "NAO", [codigo]: codigo === "G2" ? "NAO" : "SIM" })).tipo).toBe("RESULTADO");
  });
  it("C5 termina sem INST", () => {
    expect(proximoPasso("CABECA", perfil({ C1: "NAO", C2: "NAO", C3: "NAO", C4: "NAO", C5: "SIM" })).tipo).toBe("RESULTADO");
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
    expect(proximoPasso("CABECA", perfil({ C1: "NAO", C2: "NAO", C3: "NAO", C4: "NAO", C5: "NAO" }))).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "C7" } });
  });
});
