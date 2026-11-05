import type { CodigoQueixa } from "@/types/orientacao";

export const orientacoesUbs: Record<CodigoQueixa, { cuidados: string[]; procureUrgencia: string[] }> = {
  GRIPAL: {
    cuidados: [
      "Faça repouso e beba bastante líquido.",
      "Use remédio para febre ou dor só conforme orientação de um profissional de saúde.",
      "Use máscara bem ajustada, lave as mãos com frequência, cubra a tosse e o espirro com o braço e deixe a casa arejada.",
      "Evite contato com idosos, gestantes e pessoas com baixa imunidade, e evite aglomerações.",
      "Volte às atividades quando estiver há 24 horas sem febre (sem remédio para febre) e com melhora dos sintomas.",
    ],
    procureUrgencia: [
      "Falta de ar",
      "Febre por mais de 3 dias ou que volta",
      "Piora de doença que já tinha",
      "Urinar muito pouco ou não conseguir beber líquidos",
    ],
  },
  GARGANTA: {
    cuidados: [
      "Na maioria das vezes a causa é um vírus, e o tratamento é para aliviar os sintomas.",
      "Gargarejo com água morna e sal pode aliviar a dor.",
      "Não tome antibiótico por conta própria: só um profissional consegue avaliar se ele é necessário.",
      "Xarope para tosse, anti-inflamatório e vitamina C não ajudam nesse caso.",
    ],
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
      "Continue se alimentando normalmente. Se estiver vomitando, prefira refeições menores e mais vezes ao dia.",
      "Tome soro de reidratação oral depois de cada evacuação. Não misture o soro com chá, leite ou refrigerante, e lembre que ele não substitui as refeições.",
      "Não tome remédio para \"cortar\" a diarreia.",
      "A UBS fornece os sais de reidratação.",
    ],
    procureUrgencia: [
      "Sangue no vômito ou nas fezes",
      "Não conseguir manter líquidos",
      "Ficar sem urinar",
      "Confusão",
    ],
  },
  CABECA: {
    cuidados: [
      "Descanse num lugar escuro e silencioso e, se puder, tente dormir. Uma compressa fria na cabeça pode aliviar.",
      "Use analgésico só conforme orientação e evite tomar com frequência: o uso repetido pode piorar a dor de cabeça.",
      "Anote quando a dor aparece e o que pode ter causado (falta de sono, estresse, jejum). Isso ajuda na consulta.",
    ],
    procureUrgencia: [
      "Dor súbita e muito forte",
      "Febre com nuca dura",
      "Fraqueza ou fala enrolada",
      "Convulsão",
      "Vômitos em jato",
    ],
  },
  URINA: {
    cuidados: [
      "Beba mais água.",
      "Evite café e sucos ácidos, que irritam a bexiga.",
      "Uma bolsa de água morna sobre a barriga pode aliviar o desconforto.",
      "Se receber antibiótico, tome exatamente como indicado e até o fim, mesmo que melhore antes.",
      "Se houver corrimento, informe na consulta.",
    ],
    procureUrgencia: [
      "Febre com dor nas costas",
      "Vômitos que impedem de beber líquidos",
      "Confusão ou desmaio",
    ],
  },
};
