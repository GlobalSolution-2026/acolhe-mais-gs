import type { Cidadao, Consulta, EntradaListaDoDia, Horario } from "@/types";
import type { Orientacao } from "@/types/orientacao";
import { unidadesIniciais } from "./unidades";
import { chaveDia } from "@/lib/datas";
import { inicioPedidoConfirmacao, prazoConfirmacao } from "@/services/regrasAgendamento";

export interface Semente {
  cidadaos: Cidadao[];
  consultas: Consulta[];
  orientacoes: Orientacao[];
  horarios: Horario[];
  listaDoDia: EntradaListaDoDia[];
}

/** PRNG com semente fixa; a sequência é independente do relógio. */
function aleatorio() {
  let s = 20261105;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

export function gerarSemente(horariosBase: Horario[], agora: Date = new Date()): Semente {
  const rand = aleatorio();
  const H = 3_600_000, DIA = 24 * H, now = agora.getTime();
  const nomesBase = ["Maria Silva", "João Souza", "Sebastiana Ramos", "Pedro Lima", "Ana Beatriz", "Carlos Nunes", "Juliana Santos", "José Oliveira", "Mariana Costa", "Paulo Almeida", "Luciana Pereira", "Antonio Rodrigues", "Camila Ferreira", "Francisco Gomes", "Patricia Ribeiro", "Lucas Martins", "Fernanda Carvalho", "Rafael Barbosa", "Renata Rocha", "Marcos Dias", "Adriana Mendes", "Bruno Azevedo", "Sandra Cardoso", "Eduardo Teixeira", "Beatriz Moreira", "Ricardo Correia", "Claudia Batista", "Gabriel Melo", "Helena Freitas", "Diego Fernandes"];
  const nomes = [...nomesBase, ...Array.from({ length: 50 }, (_, i) => {
    const primeiros = ["Alice", "André", "Cristina", "Daniel", "Elisa", "Felipe", "Isabel", "Leonardo", "Marta", "Vinícius"];
    const sobrenomes = ["Macedo", "Duarte", "Vieira", "Barros", "Monteiro"];
    return `${primeiros[i % 10]} ${sobrenomes[Math.floor(i / 10)]}`;
  })];
  const semContatoIds = [3, 27, 29, 33, 37, 39, 43, 47];
  const recadoIds = [7, 9, 11, 13, 15, 17, 31, 35, 41, 45, 49, 51, 55];
  const telefone = (prefixo: string, i: number) => `(11) 9${prefixo}-${String(i + 1).padStart(4, "0")}`;
  const datasOriginais = ["1958-03-12", "1990-07-01", "1949-11-25", "1985-01-30", "2001-05-14", "1976-09-08"];
  const cidadaos = nomes.map((nmCidadao, i): Cidadao => {
    const idade = 18 + Math.floor(rand() * 68);
    const nascimento = new Date(agora); nascimento.setFullYear(nascimento.getFullYear() - idade);
    const semContato = semContatoIds.includes(i + 1);
    const recado = recadoIds.includes(i + 1);
    const unidade = unidadesIniciais[i % 3];
    return { cdCidadao: i + 1, nmCidadao, nrCns: i < 6 ? ["111222233334444", "222333344445555", "333444455556666", "444555566667777", "555666677778888", "666777788889999"][i] ?? "" : String(700000000000000 + i), dtNascimento: datasOriginais[i] ?? chaveDia(nascimento.toISOString()), dsSexo: i % 2 === 0 ? "F" : "M", nrCelular: semContato || recado ? "" : telefone("8888", i), nmContatoRecado: recado || i === 4 ? "Contato da família" : "", nrContatoRecado: recado || i === 4 ? telefone("7777", i) : "", nrCep: unidade?.nrCep ?? "04010-100" };
  });
  const consultas: Consulta[] = [], orientacoes: Orientacao[] = [];
  const horarios = horariosBase.map((h) => ({ ...h, flOcupado: false }));
  const hoje = chaveDia(agora.toISOString());
  // Reservar pessoas para a lista de hoje: elas não recebem consultas hoje.
  const filaIds = [19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 7, 8];
  // Reservar quatro exemplos na janela por UBS, com ambos riscos e tipos de contato.
  const exemplos = new Map<number, { id: number; alto: boolean }>();
  for (const unidade of [1, 2, 3]) {
    const slots = horarios.filter((h) => h.cdUnidade === unidade && new Date(h.dtHorario).getTime() >= now + 24 * H && new Date(h.dtHorario).getTime() <= now + 48 * H).slice(0, 4);
    const ids = unidade === 1 ? [3, 33, 1, 4] : unidade === 2 ? [27, 37, 2, 5] : [29, 39, 6, 9];
    slots.forEach((h, i) => exemplos.set(h.cdHorario, { id: ids[i] ?? 1, alto: i % 2 === 0 }));
  }
  const reservados = new Set([...exemplos].map(([id, e]) => `${e.id}:${chaveDia(horarios.find((h) => h.cdHorario === id)?.dtHorario ?? agora.toISOString())}`));
  const ativosDia = new Set<string>();
  const livresHoje = new Set(horarios.filter((h) => h.cdUnidade === 1 && chaveDia(h.dtHorario) === hoje && new Date(h.dtHorario).getTime() >= now + H).slice(-2).map((h) => h.cdHorario));

  const criar = (h: Horario, cdCidadao: number, status: Consulta["dsStatus"], alto: boolean, curta = false, anterior?: number) => {
    const t = new Date(h.dtHorario).getTime();
    const antecedencia = curta ? Math.min(12 * H, Math.max(1, t - now + H)) : alto ? (8 + rand() * 5) * DIA : (3 + rand() * 3) * DIA;
    const agendamento = anterior ?? Math.min(now - 1000, t - antecedencia);
    const riscoAlto = t - agendamento >= 7 * DIA;
    let cdOrientacao: number | null = null;
    if (rand() < .3) {
      cdOrientacao = orientacoes.length + 1;
      orientacoes.push({ cdOrientacao, cdQueixa: 1 + Math.floor(rand() * 5), dsCor: rand() < .5 ? "VERDE" : "AZUL", dsDestino: "UBS", nrDor: Math.floor(rand() * 5), flElevadaModelo: false, dtOrientacao: new Date(agendamento - H).toISOString() });
    }
    const c: Consulta = { cdConsulta: consultas.length + 1, cdHorario: h.cdHorario, cdCidadao, cdOrientacao, dtAgendamento: new Date(agendamento).toISOString(), dtHorario: h.dtHorario, dtConfirmacao: null, dsCanalConfirmacao: null, dsStatus: status, dsRiscoFalta: riscoAlto ? "ALTO" : "BAIXO", vlProbFalta: Number((riscoAlto ? .5 + rand() * .45 : .05 + rand() * .4).toFixed(2)), nmUnidade: unidadesIniciais.find((u) => u.cdUnidade === h.cdUnidade)?.nmUnidade ?? "UBS" };
    if (status === "CONFIRMADA" || status === "REALIZADA") {
      const inicio = inicioPedidoConfirmacao(c)?.getTime();
      const prazo = prazoConfirmacao(c)?.getTime();
      if (inicio !== undefined && prazo !== undefined) {
        const min = Math.max(inicio, agendamento + 1000), max = Math.min(prazo, now - 1000);
        if (max >= min) { c.dtConfirmacao = new Date(min + rand() * (max - min)).toISOString(); c.dsCanalConfirmacao = (["APP", "TELEFONE", "PRESENCIAL"] as const)[c.cdConsulta % 3] ?? "APP"; }
      }
    }
    if (c.dsStatus === "CONFIRMADA" && !c.dtConfirmacao) c.dsStatus = "AGENDADA";
    consultas.push(c); return c;
  };

  let reutilizadas = 0;
  for (const h of horarios) {
    const t = new Date(h.dtHorario).getTime(), delta = t - now;
    const exemplo = exemplos.get(h.cdHorario);
    const liberarPassada = delta < 0 && reutilizadas < 6 && h.cdUnidade === 1;
    const ocupar = !livresHoje.has(h.cdHorario) && (exemplo || liberarPassada || rand() < (delta < 0 ? .9 : delta <= 24 * H ? .96 : .85));
    if (!ocupar) continue;
    let candidatos = cidadaos.filter((c) => chaveDia(h.dtHorario) !== hoje || !filaIds.includes(c.cdCidadao));
    const dia = chaveDia(h.dtHorario);
    candidatos = candidatos.filter((c) => !ativosDia.has(`${c.cdCidadao}:${dia}`) && !reservados.has(`${c.cdCidadao}:${dia}`));
    const pessoa = candidatos[Math.floor(rand() * candidatos.length)] ?? cidadaos[0];
    if (!pessoa) continue;
    const id = exemplo?.id ?? pessoa.cdCidadao;
    const alto = exemplo?.alto ?? rand() < .45;
    const curta = delta >= 0 && delta < 24 * H && rand() < .15;
    const status: Consulta["dsStatus"] = exemplo ? "AGENDADA" : delta < 0 ? (rand() < (alto ? .32 : .13) ? "FALTA" : "REALIZADA") : delta < 24 * H ? (curta ? "AGENDADA" : "CONFIRMADA") : delta <= 72 * H ? (exemplo || liberarPassada || rand() < .65 ? "AGENDADA" : "CONFIRMADA") : "AGENDADA";
    if (liberarPassada) {
      const perdida = criar(h, id, "LIBERADA", true);
      if (reutilizadas < 4) {
        const outro = candidatos.find((c) => c.cdCidadao !== id);
        if (outro) {
          criar(h, outro.cdCidadao, "REALIZADA", false, false, new Date(perdida.dtAgendamento).getTime() + DIA);
          ativosDia.add(`${outro.cdCidadao}:${dia}`);
          h.flOcupado = true;
        }
      }
      reutilizadas++;
    } else {
      criar(h, id, status, alto, curta);
      ativosDia.add(`${id}:${dia}`);
      h.flOcupado = true;
    }
  }
  const inicioEntrada = new Date(agora); inicioEntrada.setHours(7, 0, 0, 0);
  const fimEntrada = new Date(agora); fimEntrada.setHours(17, 0, 0, 0);
  const limiteEntrada = agora < inicioEntrada || agora > fimEntrada ? fimEntrada.getTime() : now;
  const listaDoDia = filaIds.map((id, i): EntradaListaDoDia => ({ cdEntrada: i + 1, cdCidadao: id, cdUnidade: Math.floor(i / 4) + 1, nmCidadao: cidadaos.find((c) => c.cdCidadao === id)?.nmCidadao ?? "Paciente", dsCor: i % 2 === 0 ? "VERDE" : "AZUL", dtEntrada: new Date(inicioEntrada.getTime() + (limiteEntrada - inicioEntrada.getTime()) * (i + 1) / 14).toISOString(), flPrioridade: i % 4 === 0, flCidadao: false, status: "AGUARDANDO" }));
  return { cidadaos, consultas, orientacoes, horarios, listaDoDia };
}
