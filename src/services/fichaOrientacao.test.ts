import { describe, expect, it } from "vitest";
import { respostasDaFicha, respostasEfetivas, textoAvisoFicha, type FontesOrientacao } from "./fichaOrientacao";
import { calcularOrientacao, proximoPasso } from "./regrasOrientacao";
import type { Cidadao, CodigoDoencaBase, FichaSaude } from "@/types";
import type { CodigoQueixa, Respostas } from "@/types/orientacao";

const HOJE = new Date(2026, 10, 9);

const ANA: Cidadao = {
  cdCidadao: 1, nmCidadao: "Ana", nrCns: "111222233334444", dtNascimento: "1990-06-15", dsSexo: "F",
  nrCelular: "", nmContatoRecado: "", nrContatoRecado: "", nrCep: "01001-000",
};

const ficha = (dsDoencasBase: CodigoDoencaBase[]): FichaSaude => ({
  cdCidadao: 1, dsDoencasBase, dsOutraDoenca: "", medicamentos: [], dsAlergias: "", dsTipoSanguineo: "", flConsentimento: true,
  dtAtualizacao: "2026-11-01T12:00:00.000Z",
});

const paraMim: Respostas = { PF1: "PARA_MIM" };
const daFicha = (queixa: CodigoQueixa, doencas: CodigoDoencaBase[] | null, respostas: Respostas = paraMim) =>
  respostasDaFicha(queixa, respostas, ANA, doencas ? ficha(doencas) : null, HOJE);

describe("respostasDaFicha", () => {
  it("preenche idade e sexo pelo cadastro", () => {
    expect(daFicha("GARGANTA", null)).toEqual({ respostas: { PF2: 36, SX: "F" }, usados: ["idade", "sexo"] });
  });
  it.each(["DIABETES", "PULMAO", "CORACAO", "RINS", "IMUNIDADE"] as const)("P9 marca %s na gripe", (doenca) => {
    expect(daFicha("GRIPAL", [doenca]).respostas["P9"]).toEqual([doenca]);
  });
  it("P9 e U7 recebem só as doenças da ficha que batem com as opções", () => {
    expect(daFicha("GRIPAL", ["HIPERTENSAO", "DIABETES", "RINS", "OUTRA"]).respostas["P9"]).toEqual(["DIABETES", "RINS"]);
    expect(daFicha("URINA", ["PULMAO", "DIABETES", "IMUNIDADE"]).respostas["U7"]).toEqual(["DIABETES", "IMUNIDADE"]);
  });
  it("hipertensão sozinha não preenche a P9", () => {
    const r = daFicha("GRIPAL", ["HIPERTENSAO"]);
    expect(r.respostas).not.toHaveProperty("P9");
    expect(r.usados).toEqual(["idade", "sexo"]);
  });
  it("D11 = SIM na diarreia só com diabetes (a D11a não é preenchida)", () => {
    expect(daFicha("DIARREIA", ["DIABETES"]).respostas).toMatchObject({ D11: "SIM" });
    expect(daFicha("DIARREIA", ["DIABETES"]).respostas).not.toHaveProperty("D11a");
    expect(daFicha("DIARREIA", ["IMUNIDADE"]).respostas).not.toHaveProperty("D11");
  });
  it.each([["DIABETES", true], ["IMUNIDADE", true], ["PULMAO", false], ["HIPERTENSAO", false]] as const)(
    "U7 na urina com %s: preenchida = %s", (doenca, preenche) => {
      expect("U7" in daFicha("URINA", [doenca]).respostas).toBe(preenche);
    });
  it("ausência da doença na ficha não vira 'NAO': a pergunta continua sendo feita", () => {
    expect(daFicha("GRIPAL", []).respostas).not.toHaveProperty("P9");
    expect(daFicha("URINA", []).respostas).not.toHaveProperty("U7");
  });
  it("gestação (PF3) nunca vem da ficha", () => {
    expect(daFicha("GRIPAL", ["DIABETES"]).respostas).not.toHaveProperty("PF3");
  });
  it("só lista as doenças usadas na queixa atual", () => {
    expect(daFicha("GRIPAL", ["DIABETES", "RINS", "HIPERTENSAO"]).usados).toEqual(["idade", "sexo", "diabetes", "doença dos rins"]);
    expect(daFicha("GARGANTA", ["DIABETES"]).usados).toEqual(["idade", "sexo"]);
  });
  it("sem ficha preenche só o cadastro", () => {
    expect(daFicha("GRIPAL", null).respostas).toEqual({ PF2: 36, SX: "F" });
  });
  it("OUTRA_PESSOA, PF1 ainda não respondida ou sem login não preenche nada", () => {
    expect(daFicha("GRIPAL", ["DIABETES"], { PF1: "OUTRA_PESSOA" })).toEqual({ respostas: {}, usados: [] });
    expect(daFicha("GRIPAL", ["DIABETES"], {})).toEqual({ respostas: {}, usados: [] });
    expect(respostasDaFicha("GRIPAL", paraMim, null, ficha(["DIABETES"]), HOJE)).toEqual({ respostas: {}, usados: [] });
  });
});

describe("textoAvisoFicha", () => {
  it("só cadastro", () => {
    expect(textoAvisoFicha(["idade", "sexo"])).toBe("Usamos dados do seu cadastro: idade e sexo.");
  });
  it("cadastro e ficha", () => {
    expect(textoAvisoFicha(["idade", "sexo", "diabetes"])).toBe("Usamos dados do seu cadastro e da sua ficha de saúde: idade, sexo e diabetes.");
  });
});

describe("questionário com a ficha", () => {
  const fontes = (respostas: Respostas, doencas: CodigoDoencaBase[] | null, cdCidadaoAtual: number | null = 1): FontesOrientacao => ({
    orientacaoAtual: { cdQueixa: "GRIPAL", nrCep: "01001-000", respostas, ordem: Object.keys(respostas), resultado: null },
    cidadaos: [ANA],
    cdCidadaoAtual,
    fichas: doencas ? [ficha(doencas)] : [],
  });
  const ateP8: Respostas = {
    PF1: "PARA_MIM", PF3: "NAO", DOR: 2, P0: ["FEBRE", "TOSSE"],
    P1: "NAO", P2: "NAO", P3: "NAO", P4: ["NENHUM"], P5: "NAO", P6: "NAO", P7: ["NENHUM"], P8: "NAO",
  };

  it("pula a P9 quando a ficha tem diabetes", () => {
    const efetivas = respostasEfetivas(fontes(ateP8, ["DIABETES"]), HOJE)!;
    expect(proximoPasso("GRIPAL", efetivas.respostas).tipo).toBe("RESULTADO");
    expect(calcularOrientacao("GRIPAL", efetivas.respostas).dsCor).toBe("VERDE");
  });
  it("sem a doença na ficha, a P9 continua sendo perguntada", () => {
    const efetivas = respostasEfetivas(fontes(ateP8, ["HIPERTENSAO"]), HOJE)!;
    expect(proximoPasso("GRIPAL", efetivas.respostas)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "P9" } });
  });
  it("depois da PF1 = Para mim, pula idade e sexo", () => {
    const efetivas = respostasEfetivas(fontes({ PF1: "PARA_MIM" }, null), HOJE)!;
    expect(proximoPasso("GRIPAL", efetivas.respostas)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "PF3" } });
  });
  it("sem login, idade e sexo continuam sendo perguntados", () => {
    const efetivas = respostasEfetivas(fontes({ PF1: "PARA_MIM" }, ["DIABETES"], null), HOJE)!;
    expect(efetivas.usados).toEqual([]);
    expect(proximoPasso("GRIPAL", efetivas.respostas)).toMatchObject({ tipo: "PERGUNTA", pergunta: { codigo: "PF2" } });
  });
  it("as respostas digitadas valem mais que as da ficha", () => {
    const efetivas = respostasEfetivas(fontes({ PF1: "PARA_MIM", PF2: 40 }, null), HOJE)!;
    expect(efetivas.respostas["PF2"]).toBe(40);
  });
});
