import { describe, expect, it } from "vitest";
import { calcularOrientacao, perguntasDaQueixa, proximoPasso } from "./regrasOrientacao";
import type { CodigoQueixa, Respostas } from "@/types/orientacao";

const perfil = (extra: Respostas = {}): Respostas => ({ PF1: "PARA_MIM", PF2: 30, PF3: "NAO", DOR: 2, ...extra });

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
    expect(calcularOrientacao("GARGANTA", perfil({ G2: "SIM" })).dsCor).toBe("LARANJA");
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
  const base = perfil({ PF3: "NAO_SE_APLICA", U6: "F", U7: "NAO" });
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
    expect(calcularOrientacao("URINA", { ...base, U2: "NAO", U3: "NAO", U6: "M" }).dsCor).toBe("VERDE");
    expect(calcularOrientacao("URINA", { ...base, U2: "NAO", U3: "NAO", U4: "NAO" }).dsCor).toBe("AZUL");
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
    ["GARGANTA", { G5: "NAO_SEI", G6: "SIM" }],
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
    expect(proximoPasso("GARGANTA", perfil({ G0: "NAO", G1: "NAO", [codigo]: "SIM" })).tipo).toBe("RESULTADO");
  });
  it("C5 termina sem INST", () => {
    expect(proximoPasso("CABECA", perfil({ C1: "NAO", C2: "NAO", C3: "NAO", C4: "NAO", C5: "SIM" })).tipo).toBe("RESULTADO");
  });
});
