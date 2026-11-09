import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buscarEndereco, enderecoParaLigacao, formatarEndereco } from "./cep";
import type { EnderecoCep } from "@/types/orientacao";

const SE: EnderecoCep = { dsLogradouro: "Praça da Sé", dsBairro: "Sé", nmCidade: "São Paulo", sgUf: "SP" };

const resposta = (corpo: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corpo) }) as Response;

describe("buscarEndereco", () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("sucesso: chama o ViaCEP com 8 dígitos e mapeia os campos", async () => {
    fetchMock.mockResolvedValue(resposta({ cep: "01001-000", logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP" }));
    await expect(buscarEndereco("01001-000")).resolves.toEqual(SE);
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/01001000/json/", expect.anything());
  });
  it.each([true, "true"])("CEP não encontrado (erro: %s) devolve null", async (erro) => {
    fetchMock.mockResolvedValue(resposta({ erro }));
    await expect(buscarEndereco("99999-999")).resolves.toBeNull();
  });
  it("falha de rede rejeita", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(buscarEndereco("01001-000")).rejects.toThrow();
  });
  it("erro HTTP rejeita", async () => {
    fetchMock.mockResolvedValue(resposta({}, 500));
    await expect(buscarEndereco("01001-000")).rejects.toThrow("Não foi possível consultar o CEP.");
  });
  it("CEP incompleto devolve null sem chamar o fetch", async () => {
    await expect(buscarEndereco("0100")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("formatarEndereco", () => {
  it("endereço completo com número, complemento e CEP", () => {
    expect(formatarEndereco(SE, { nrEndereco: "123", dsComplemento: "apto 4", nrCep: "01001-000" }))
      .toBe("Praça da Sé, 123, apto 4 – Sé, São Paulo/SP · CEP 01001-000");
  });
  it("sem número e sem complemento", () => {
    expect(formatarEndereco(SE)).toBe("Praça da Sé – Sé, São Paulo/SP");
  });
  it("CEP de cidade sem rua nem bairro", () => {
    expect(formatarEndereco({ dsLogradouro: "", dsBairro: "", nmCidade: "Borá", sgUf: "SP" })).toBe("Borá/SP");
  });
  it("sem cidade e UF não sobra uma '/' sozinha", () => {
    const vazio = { dsLogradouro: "Rua A", dsBairro: "Centro", nmCidade: "", sgUf: "" };
    expect(formatarEndereco(vazio)).toBe("Rua A – Centro");
    expect(formatarEndereco({ ...vazio, dsLogradouro: "", dsBairro: "" }, { nrCep: "01001-000" })).toBe("CEP 01001-000");
  });
});

describe("enderecoParaLigacao", () => {
  it("com ViaCEP usa o endereço completo", () => {
    expect(enderecoParaLigacao("01001-000", { endereco: SE, nrEndereco: "123", dsComplemento: "" }))
      .toBe("Praça da Sé, 123 – Sé, São Paulo/SP · CEP 01001-000");
  });
  it("sem ViaCEP, com número e complemento", () => {
    expect(enderecoParaLigacao("01001-000", { endereco: null, nrEndereco: "123", dsComplemento: "apto 4" }))
      .toBe("CEP 01001-000, nº 123, apto 4");
  });
  it("sem ViaCEP, só com número", () => {
    expect(enderecoParaLigacao("01001-000", { endereco: null, nrEndereco: "123", dsComplemento: "" })).toBe("CEP 01001-000, nº 123");
  });
  it("sem ViaCEP, sem número nem complemento: só o CEP", () => {
    expect(enderecoParaLigacao("01001-000", { endereco: null, nrEndereco: "", dsComplemento: "" })).toBe("CEP 01001-000");
    expect(enderecoParaLigacao("01001-000", {})).toBe("CEP 01001-000");
  });
});
