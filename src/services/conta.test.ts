import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { CidadaoEntrada } from "@/types";
import { CONTA_DEMO, credenciaisIniciais } from "@/data/contaDemo";
import { gerarSemente } from "@/data/consultasIniciais";
import { gerarHorariosIniciais } from "@/data/horarios";
import { atualizarCidadao, conectarStore, criarConta, entrar, salvarFicha } from "./api";

const dados: CidadaoEntrada = { nmCidadao: "Ana", nrCns: "123456789012345", dtNascimento: "1990-01-01", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "" };
let estado: EstadoSimulador;

beforeEach(() => {
  vi.useFakeTimers();
  estado = { dtSemente: "2026-11-09", unidades: [], horarios: [], cidadaos: [], consultas: [], cdUnidadeRecepcao: 1, orientacoes: [], orientacaoAtual: null, listaDoDia: [], ofertas: [], cdCidadaoAtual: null, credenciais: [], fichas: [] };
  conectarStore({ obterEstado: () => estado, atualizarEstado: (fn) => { estado = fn(estado); } });
});

const rodar = async <T,>(p: Promise<T>) => { await vi.runAllTimersAsync(); return p; };

describe("conta mock", () => {
  it("cria conta e entra com CNS + senha", async () => {
    await rodar(criarConta(dados, "segredo1"));
    const c = await rodar(entrar("123456789012345", "segredo1"));
    expect(c.nmCidadao).toBe("Ana");
  });
  it("recusa senha errada", async () => {
    await rodar(criarConta(dados, "segredo1"));
    const p = entrar("123456789012345", "errada");
    const r = expect(p).rejects.toThrow("Cartão SUS ou senha incorretos.");
    await vi.runAllTimersAsync();
    await r;
  });
  it("não salva ficha sem consentimento LGPD", async () => {
    await expect(salvarFicha({ cdCidadao: 1, dsDoencasBase: [], dsOutraDoenca: "", medicamentos: [], dsAlergias: "", dsTipoSanguineo: "", flConsentimento: false })).rejects.toThrow("LGPD");
  });
});

/** Estado com a semente real da demonstração (80 cidadãos, só a conta demo tem senha). */
function comSemente() {
  const hoje = new Date(2026, 10, 18, 10, 0, 0);
  const semente = gerarSemente(gerarHorariosIniciais(hoje), hoje);
  estado = { ...estado, cidadaos: semente.cidadaos, consultas: semente.consultas, orientacoes: semente.orientacoes, horarios: semente.horarios, listaDoDia: semente.listaDoDia, credenciais: [...credenciaisIniciais] };
}

describe("conta nova não herda a demonstração", () => {
  it("CNS com padrão de teclado (antes usado pela semente) cria conta sem nenhuma consulta", async () => {
    comSemente();
    const c = await rodar(criarConta({ ...dados, nrCns: "222333344445555" }, "segredo1"));
    expect(c.cdCidadao).toBe(81);
    expect(estado.consultas.filter((x) => x.cdCidadao === c.cdCidadao)).toEqual([]);
    expect(estado.cidadaos).toHaveLength(81);
  });
  it("nenhum CNS de exemplo, além da conta demo, tem formato de CNS real (1, 2, 7, 8 ou 9)", () => {
    comSemente();
    const outros = estado.cidadaos.filter((c) => c.cdCidadao !== CONTA_DEMO.cdCidadao);
    expect(estado.cidadaos.find((c) => c.cdCidadao === CONTA_DEMO.cdCidadao)?.nrCns).toBe("111222233334444");
    expect(outros.every((c) => /^0\d{14}$/.test(c.nrCns))).toBe(true);
    expect(new Set(estado.cidadaos.map((c) => c.nrCns)).size).toBe(80);
  });
  it("RN21: cadastro da recepção sem senha é completado e mantém as consultas já marcadas", async () => {
    comSemente();
    const recepcao = estado.cidadaos.find((c) => c.cdCidadao !== CONTA_DEMO.cdCidadao && estado.consultas.some((x) => x.cdCidadao === c.cdCidadao));
    if (!recepcao) throw new Error("semente sem cadastro com consulta");
    const antes = estado.consultas.filter((x) => x.cdCidadao === recepcao.cdCidadao).length;
    const c = await rodar(criarConta({ ...dados, nrCns: recepcao.nrCns, nrCelular: "(11) 91234-5678" }, "segredo1"));
    expect(c.cdCidadao).toBe(recepcao.cdCidadao);
    expect(estado.cidadaos).toHaveLength(80);
    expect(estado.consultas.filter((x) => x.cdCidadao === c.cdCidadao)).toHaveLength(antes);
    expect(estado.cidadaos.find((x) => x.cdCidadao === c.cdCidadao)?.nrCelular).toBe("(11) 91234-5678");
  });
});

describe("identificação protegida no serviço (RF27)", () => {
  it("manterIdentificacao ignora CNS, nascimento, nome e sexo diferentes e grava celular e contato", async () => {
    const criado = await rodar(criarConta(dados, "segredo1"));
    const r = await rodar(atualizarCidadao(criado.cdCidadao, { ...dados, nrCns: "999999999999999", dtNascimento: "2000-12-31", nmCidadao: "Outra", dsSexo: "M", nrCelular: "(11) 95555-0000", nmContatoRecado: "Irmã", nrContatoRecado: "(11) 94444-0000" }, { manterIdentificacao: true }));
    const salvo = estado.cidadaos.find((c) => c.cdCidadao === criado.cdCidadao);
    for (const c of [r, salvo]) {
      expect(c).toMatchObject({ nrCns: "123456789012345", dtNascimento: "1990-01-01", nmCidadao: "Ana", dsSexo: "F", nrCelular: "(11) 95555-0000", nmContatoRecado: "Irmã", nrContatoRecado: "(11) 94444-0000" });
    }
  });
  it("sem a opção (balcão, RN21), o cadastro é atualizado por inteiro", async () => {
    const criado = await rodar(criarConta(dados, "segredo1"));
    await rodar(atualizarCidadao(criado.cdCidadao, { ...dados, nmCidadao: "Ana Maria" }));
    expect(estado.cidadaos[0]?.nmCidadao).toBe("Ana Maria");
  });
});
