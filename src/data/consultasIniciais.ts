/**
 * Dados iniciais da demonstração: cidadãos e consultas já existentes em várias UBS,
 * com riscos e status variados (inclusive um paciente sem nenhum contato válido).
 */
import type { Cidadao, Consulta, Horario } from "@/types";
import type { Orientacao } from "@/types/orientacao";

const HORAS = [8, 9, 10, 11, 14, 15, 16];

function achar(horarios: Horario[], cdUnidade: number, dia: number, hora: number): Horario {
  const daUnidade = horarios
    .filter((h) => h.cdUnidade === cdUnidade)
    .sort((a, b) => a.dtHorario.localeCompare(b.dtHorario));
  const h = daUnidade[dia * HORAS.length + HORAS.indexOf(hora)];
  if (!h) throw new Error("Horário da semente não encontrado.");
  return h;
}

export interface Semente {
  cidadaos: Cidadao[];
  consultas: Consulta[];
  orientacoes: Orientacao[];
  horarios: Horario[];
}

export function gerarSemente(horariosBase: Horario[], agora: Date = new Date()): Semente {
  const cidadaos: Cidadao[] = [
    { cdCidadao: 1, nmCidadao: "Maria Silva", nrCns: "111222233334444", dtNascimento: "1958-03-12", dsSexo: "F", nrCelular: "(11) 98888-0001", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" },
    { cdCidadao: 2, nmCidadao: "João Souza", nrCns: "222333344445555", dtNascimento: "1990-07-01", dsSexo: "M", nrCelular: "(11) 97777-0002", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" },
    { cdCidadao: 3, nmCidadao: "Sebastiana Ramos", nrCns: "333444455556666", dtNascimento: "1949-11-25", dsSexo: "F", nrCelular: "", nmContatoRecado: "", nrContatoRecado: "", nrCep: "05405-000" },
    { cdCidadao: 4, nmCidadao: "Pedro Lima", nrCns: "444555566667777", dtNascimento: "1985-01-30", dsSexo: "M", nrCelular: "(11) 96666-0004", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" },
    { cdCidadao: 5, nmCidadao: "Ana Beatriz", nrCns: "555666677778888", dtNascimento: "2001-05-14", dsSexo: "F", nrCelular: "(11) 95555-0005", nmContatoRecado: "Carla (irmã)", nrContatoRecado: "(11) 94444-0005", nrCep: "03081-000" },
    { cdCidadao: 6, nmCidadao: "Carlos Nunes", nrCns: "666777788889999", dtNascimento: "1976-09-08", dsSexo: "M", nrCelular: "(11) 93333-0006", nmContatoRecado: "", nrContatoRecado: "", nrCep: "04010-100" },
  ];

  const orientacoes: Orientacao[] = [
    { cdOrientacao: 1, cdQueixa: 1, dsCor: "VERDE", dsDestino: "UBS", nrDor: 3, flElevadaModelo: false, dtOrientacao: agora.toISOString() },
  ];

  const h1 = achar(horariosBase, 1, 2, 9); // Maria — AGENDADA, risco ALTO
  const h2 = achar(horariosBase, 1, 1, 14); // João — CONFIRMADA, risco BAIXO
  const h3 = achar(horariosBase, 2, 1, 10); // Sebastiana — AGENDADA, sem contato válido
  const h4 = achar(horariosBase, 1, 0, 8); // Pedro — REALIZADA, vinda de orientação
  const h5 = achar(horariosBase, 3, 0, 9); // Ana — FALTA
  const h6 = achar(horariosBase, 1, 3, 15); // Carlos — AGENDADA, risco BAIXO

  const mk = (
    cdConsulta: number,
    h: Horario,
    cdCidadao: number,
    dsStatus: Consulta["dsStatus"],
    dsRiscoFalta: Consulta["dsRiscoFalta"],
    vlProbFalta: number,
    extra: Partial<Consulta> = {},
  ): Consulta => ({
    cdConsulta,
    cdHorario: h.cdHorario,
    cdCidadao,
    cdOrientacao: null,
    dtAgendamento: agora.toISOString(),
    dtConfirmacao: null,
    dsCanalConfirmacao: null,
    dsStatus,
    vlProbFalta,
    dsRiscoFalta,
    nmUnidade: "",
    dtHorario: h.dtHorario,
    ...extra,
  });

  const consultas: Consulta[] = [
    mk(1, h1, 1, "AGENDADA", "ALTO", 0.72),
    mk(2, h2, 2, "CONFIRMADA", "BAIXO", 0.18, { dtConfirmacao: agora.toISOString(), dsCanalConfirmacao: "APP" }),
    mk(3, h3, 3, "AGENDADA", "ALTO", 0.81),
    mk(4, h4, 4, "REALIZADA", "BAIXO", 0.12, { cdOrientacao: 1, dtConfirmacao: agora.toISOString(), dsCanalConfirmacao: "TELEFONE" }),
    mk(5, h5, 5, "FALTA", "ALTO", 0.66),
    mk(6, h6, 6, "AGENDADA", "BAIXO", 0.22),
  ];

  const ocupados = new Set([h1, h2, h3, h4, h5, h6].map((h) => h.cdHorario));
  const horarios = horariosBase.map((h) => (ocupados.has(h.cdHorario) ? { ...h, flOcupado: true } : h));

  return { cidadaos, consultas, orientacoes, horarios };
}
