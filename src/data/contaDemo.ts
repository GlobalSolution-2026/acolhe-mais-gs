import type { CodigoDoencaBase, CredencialCidadao, FichaSaude } from "@/types";

/** DEMONSTRAÇÃO: conta de exemplo exibida no Modo demonstração. */
export const CONTA_DEMO = { cdCidadao: 1, nrCns: "111222233334444", dsSenha: "acolhe123" } as const;

export const credenciaisIniciais: CredencialCidadao[] = [{ cdCidadao: CONTA_DEMO.cdCidadao, dsSenha: CONTA_DEMO.dsSenha }];

export const DOENCAS_BASE: { cd: CodigoDoencaBase; nm: string }[] = [
  { cd: "DIABETES", nm: "Diabetes" },
  { cd: "HIPERTENSAO", nm: "Hipertensão (pressão alta)" },
  { cd: "PULMAO", nm: "Asma ou outra doença do pulmão" },
  { cd: "CORACAO", nm: "Doença do coração" },
  { cd: "RINS", nm: "Doença dos rins" },
  { cd: "IMUNIDADE", nm: "Baixa imunidade" },
  { cd: "OUTRA", nm: "Outra" },
];

export function fichasIniciais(agora: Date): FichaSaude[] {
  return [{
    cdCidadao: CONTA_DEMO.cdCidadao,
    dsDoencasBase: ["HIPERTENSAO", "DIABETES"],
    dsOutraDoenca: "",
    medicamentos: [{ nmMedicamento: "Losartana", dsDose: "50 mg, 1 vez ao dia" }, { nmMedicamento: "Metformina", dsDose: "850 mg, 2 vezes ao dia" }],
    dsAlergias: "Dipirona",
    dsTipoSanguineo: "O+",
    flConsentimento: true,
    dtAtualizacao: new Date(agora.getTime() - 3 * 86_400_000).toISOString(),
  }];
}
