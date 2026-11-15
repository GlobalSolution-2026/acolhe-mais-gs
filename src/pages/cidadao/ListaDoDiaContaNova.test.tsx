import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SimuladorProvider, useSimulador } from "@/context/SimuladorContext";
import { CONTA_DEMO } from "@/data/contaDemo";
import { entradaDoCidadao } from "@/services/regrasAgendamento";

let sim: ReturnType<typeof useSimulador> | null = null;
function Espiao() {
  sim = useSimulador();
  return null;
}
const atual = () => {
  if (!sim) throw new Error("Provider não montado");
  return sim;
};

beforeEach(() => {
  localStorage.clear();
  sim = null;
});

describe("lista do dia ao trocar de conta no mesmo aparelho", () => {
  it("a entrada da conta demo não passa para a conta criada depois", () => {
    render(<SimuladorProvider><Espiao /></SimuladorProvider>);
    act(() => atual().definirCidadaoAtual(CONTA_DEMO.cdCidadao));
    act(() => atual().entrarNaListaDoDia(2, "VERDE", 77));
    const daDemo = entradaDoCidadao(atual().estado.listaDoDia, CONTA_DEMO.cdCidadao);
    expect(daDemo).toMatchObject({ cdUnidade: 2, cdCidadao: CONTA_DEMO.cdCidadao, flCidadao: true });

    // Sai da conta demo e entra numa conta nova (cdCidadao 81, criada depois da semente).
    act(() => atual().atualizarEstado((e) => ({
      ...e,
      cdCidadaoAtual: null,
      cidadaos: [...e.cidadaos, { cdCidadao: 81, nmCidadao: "Nova Pessoa", nrCns: "123123123123123", dtNascimento: "1990-01-01", dsSexo: "F", nrCelular: "11977771234", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" }],
    })));
    act(() => atual().definirCidadaoAtual(81));

    const fila = atual().estado.listaDoDia;
    expect(fila.find((e) => e.cdEntrada === daDemo?.cdEntrada)).toMatchObject({ cdCidadao: CONTA_DEMO.cdCidadao, nmCidadao: daDemo?.nmCidadao });
    expect(entradaDoCidadao(fila, 81)).toBeUndefined();

    // A conta nova pode entrar na lista com a própria orientação; a da demo continua dela.
    act(() => atual().entrarNaListaDoDia(3, "AZUL", 91));
    expect(entradaDoCidadao(atual().estado.listaDoDia, 81)).toMatchObject({ cdUnidade: 3, cdOrientacao: 91, nmCidadao: "Nova Pessoa" });
    expect(entradaDoCidadao(atual().estado.listaDoDia, CONTA_DEMO.cdCidadao)?.cdUnidade).toBe(2);
  });
});
