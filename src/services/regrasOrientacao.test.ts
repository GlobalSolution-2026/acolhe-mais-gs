import { describe, expect, it } from "vitest";
import { calcularOrientacao, proximoPasso } from "./regrasOrientacao";
import type { Respostas } from "@/types/orientacao";

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
  it("VERMELHO ao não engolir saliva", () => {
    expect(calcularOrientacao("GARGANTA", perfil({ G2: "SIM" })).dsCor).toBe("VERMELHO");
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
  it("VERMELHO com dor 8", () => {
    expect(calcularOrientacao("DIARREIA", perfil({ DOR: 8 })).dsCor).toBe("VERMELHO");
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
