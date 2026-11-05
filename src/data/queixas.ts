import type { CodigoQueixa, Queixa } from "@/types/orientacao";

export const queixas: Queixa[] = [
  { cdQueixa: 1, codigo: "GRIPAL", nmQueixa: "Síndrome gripal" },
  { cdQueixa: 2, codigo: "GARGANTA", nmQueixa: "Dor de garganta" },
  { cdQueixa: 3, codigo: "DIARREIA", nmQueixa: "Diarreia e vômito" },
  { cdQueixa: 4, codigo: "CABECA", nmQueixa: "Dor de cabeça" },
  { cdQueixa: 5, codigo: "URINA", nmQueixa: "Ardência ao urinar" },
];

export function obterQueixa(codigo: CodigoQueixa): Queixa {
  return queixas.find((q) => q.codigo === codigo)!;
}
