import { describe, expect, it } from "vitest";
import { gerarHorariosIniciais } from "./horarios";
import { gerarSemente } from "./consultasIniciais";
import { chaveDia, listarDiasUnidade } from "@/lib/datas";
import { inicioPedidoConfirmacao, prazoConfirmacao, precisaConfirmar, temContatoValido } from "@/services/regrasAgendamento";

for (const data of ["2026-11-05T10:30:00", "2026-11-07T00:00:01", "2026-11-08T23:30:00", "2026-11-06T23:52:00"]) {
  describe(`semente ${data}`, () => {
    const agora = new Date(data);
    const horarios = gerarHorariosIniciais(agora);
    const s = gerarSemente(horarios, agora);
    it("reproduz a mesma distribuição e inclui hoje, 8 dias passados e 10 futuros", () => {
      expect(gerarSemente(horarios, agora)).toEqual(s);
      expect(listarDiasUnidade(horarios, 1).length).toBeGreaterThanOrEqual(19);
      expect(listarDiasUnidade(horarios, 1)).toContain(chaveDia(agora.toISOString()));
      expect(horarios.length).toBe(listarDiasUnidade(horarios, 1).length * 3 * 7);
    });
    it("nunca realizada/falta futura e unidade sempre preenchida", () => {
      for (const c of s.consultas) {
        expect(c.nmUnidade.length).toBeGreaterThan(0);
        if (["REALIZADA", "FALTA"].includes(c.dsStatus)) expect(new Date(c.dtHorario).getTime()).toBeLessThan(agora.getTime());
        expect(new Date(c.dtAgendamento).getTime()).toBeLessThan(new Date(c.dtHorario).getTime());
        expect(new Date(c.dtAgendamento).getTime()).toBeLessThan(agora.getTime());
      }
    });
    it("no máximo uma consulta ativa por pessoa por dia", () => {
      const chaves = s.consultas.filter((c) => c.dsStatus !== "LIBERADA").map((c) => `${c.cdCidadao}:${chaveDia(c.dtHorario)}`);
      expect(new Set(chaves).size).toBe(chaves.length);
    });
    it("quatro das seis vagas liberadas foram reocupadas", () => {
      const liberadas = s.consultas.filter((c) => c.dsStatus === "LIBERADA");
      expect(liberadas).toHaveLength(6);
      expect(liberadas.filter((l) => s.consultas.some((c) => c.cdHorario === l.cdHorario && c.dsStatus !== "LIBERADA"))).toHaveLength(4);
    });
    it("ocupação tem exatamente uma consulta não liberada e vice-versa", () => {
      for (const h of s.horarios) {
        const ativas = s.consultas.filter((c) => c.cdHorario === h.cdHorario && c.dsStatus !== "LIBERADA");
        expect(ativas.length).toBe(h.flOcupado ? 1 : 0);
      }
    });
    it("pendentes com e sem contato por UBS, e ambos riscos", () => {
      for (const unidade of [1, 2, 3]) {
        const pendentes = s.consultas.filter((c) => c.dsStatus === "AGENDADA" && s.horarios.find((h) => h.cdHorario === c.cdHorario)?.cdUnidade === unidade);
        expect(pendentes.some((c) => { const p = s.cidadaos.find((p) => p.cdCidadao === c.cdCidadao); return p && !temContatoValido(p); })).toBe(true);
        expect(pendentes.some((c) => { const p = s.cidadaos.find((p) => p.cdCidadao === c.cdCidadao); return p && temContatoValido(p); })).toBe(true);
      }
      expect(new Set(s.consultas.map((c) => c.dsRiscoFalta))).toEqual(new Set(["ALTO", "BAIXO"]));
    });
    it("risco, probabilidades, confirmação e orientação coerentes", () => {
      for (const c of s.consultas) {
        const antecedencia = (new Date(c.dtHorario).getTime() - new Date(c.dtAgendamento).getTime()) / 86400000;
        expect(c.dsRiscoFalta).toBe(antecedencia >= 7 ? "ALTO" : "BAIXO");
        expect(c.vlProbFalta).toBeGreaterThanOrEqual(c.dsRiscoFalta === "ALTO" ? .5 : .05);
        expect(c.vlProbFalta).toBeLessThanOrEqual(c.dsRiscoFalta === "ALTO" ? .95 : .45);
        if (c.dsStatus === "CONFIRMADA") { expect(c.dtConfirmacao).not.toBeNull(); expect(c.dsCanalConfirmacao).not.toBeNull(); }
        if (c.dtConfirmacao) {
          expect(new Date(c.dtConfirmacao).getTime()).toBeGreaterThanOrEqual(inicioPedidoConfirmacao(c)?.getTime() ?? Infinity);
          expect(new Date(c.dtConfirmacao).getTime()).toBeLessThanOrEqual(prazoConfirmacao(c)?.getTime() ?? -Infinity);
          expect(new Date(c.dtConfirmacao).getTime()).toBeLessThan(agora.getTime());
        }
        if (c.cdOrientacao !== null) expect(new Date(s.orientacoes.find((o) => o.cdOrientacao === c.cdOrientacao)?.dtOrientacao ?? "").getTime()).toBeLessThan(new Date(c.dtAgendamento).getTime());
      }
    });
    it("listas de hoje usam cadastrados sem consulta hoje e têm prioridade", () => {
      expect(s.cidadaos).toHaveLength(80);
      expect(s.cidadaos.filter((p) => !temContatoValido(p))).toHaveLength(8);
      for (const e of s.listaDoDia) {
        expect(e.cdCidadao).not.toBeNull();
        expect(chaveDia(e.dtEntrada)).toBe(chaveDia(agora.toISOString()));
        const inicio = new Date(agora); inicio.setHours(7, 0, 0, 0);
        const fim = new Date(agora); fim.setHours(17, 0, 0, 0);
        const limite = agora < inicio || agora > fim ? fim : agora;
        expect(new Date(e.dtEntrada).getTime()).toBeGreaterThanOrEqual(inicio.getTime());
        expect(new Date(e.dtEntrada).getTime()).toBeLessThanOrEqual(limite.getTime());
        expect(s.consultas.some((c) => c.cdCidadao === e.cdCidadao && chaveDia(c.dtHorario) === chaveDia(agora.toISOString()))).toBe(false);
      }
      for (const unidade of [1, 2, 3]) expect(s.listaDoDia.filter((e) => e.cdUnidade === unidade && e.flPrioridade)).toHaveLength(1);
    });
    it("se existir hora hoje depois de +60 min, preserva vaga livre", () => {
      const elegiveis = s.horarios.filter((h) => chaveDia(h.dtHorario) === chaveDia(agora.toISOString()) && new Date(h.dtHorario).getTime() >= agora.getTime() + 3600000);
      if (elegiveis.length) expect(elegiveis.some((h) => !h.flOcupado)).toBe(true);
      expect(s.consultas.filter((c) => c.dsStatus === "LIBERADA")).toHaveLength(6);
    });
  });
}

for (let dia = 2; dia <= 8; dia++) for (const hora of [0, 6, 7, 10, 16, 17, 23]) {
  it(`janela de confirmação em todas as UBS no dia ${dia}, às ${hora}h`, () => {
    const agora = new Date(2026, 10, dia, hora, 30);
    const s = gerarSemente(gerarHorariosIniciais(agora), agora);
    for (const unidade of [1, 2, 3]) for (const risco of ["ALTO", "BAIXO"] as const) for (const contato of [true, false]) {
      expect(s.consultas.some((c) => c.dsRiscoFalta === risco && precisaConfirmar(c, agora) && s.horarios.find((h) => h.cdHorario === c.cdHorario)?.cdUnidade === unidade && s.cidadaos.some((p) => p.cdCidadao === c.cdCidadao && temContatoValido(p) === contato))).toBe(true);
    }
  });
}
