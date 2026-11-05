import type { CodigoQueixa } from "@/types/orientacao";

export const orientacoesUbs: Record<CodigoQueixa, { cuidados: string[]; procureUrgencia: string[] }> = {
  GRIPAL: {
    cuidados: ["Descanse e beba bastante líquido.", "Use máscara perto de outras pessoas."],
    procureUrgencia: [
      "Falta de ar",
      "Febre por mais de 3 dias ou que volta",
      "Piora de doença que já tinha",
      "Urinar muito pouco ou não conseguir beber líquidos",
    ],
  },
  GARGANTA: {
    cuidados: ["Beba líquidos e prefira alimentos macios."],
    procureUrgencia: [
      "Falta de ar",
      "Não conseguir engolir a saliva",
      "Dificuldade para abrir a boca",
      "Voz abafada",
      "Não conseguir beber líquidos",
    ],
  },
  DIARREIA: {
    cuidados: [
      "Mantenha a alimentação.",
      "Beba mais líquidos.",
      "Use soro de reidratação oral.",
      "Não tome remédio para \"cortar\" a diarreia.",
    ],
    procureUrgencia: [
      "Sangue no vômito ou nas fezes",
      "Não conseguir manter líquidos",
      "Ficar sem urinar",
      "Confusão",
    ],
  },
  CABECA: {
    cuidados: ["Evite usar analgésicos com frequência."],
    procureUrgencia: [
      "Dor súbita e muito forte",
      "Febre com nuca dura",
      "Fraqueza ou fala enrolada",
      "Convulsão",
      "Vômitos em jato",
    ],
  },
  URINA: {
    cuidados: ["Se houver corrimento, informe na consulta."],
    procureUrgencia: [
      "Febre com dor nas costas",
      "Vômitos que impedem de beber líquidos",
      "Confusão ou desmaio",
    ],
  },
};
