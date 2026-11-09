import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EstadoSimulador } from "@/context/SimuladorContext";
import type { CidadaoEntrada } from "@/types";
import { conectarStore, criarConta, entrar, salvarFicha } from "./api";

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
