export interface Integrante {
  rm: string;
  nome: string;
  github: string;
  papel: string;
}

export const integrantes: Integrante[] = [
  { rm: "550001", nome: "Ana Carolina Souza", github: "anacarolina-dev", papel: "Front-end e design" },
  { rm: "550002", nome: "Bruno Lima", github: "brunolima", papel: "API Java" },
  { rm: "550003", nome: "Carla Mendes", github: "carlamendes", papel: "Banco de dados" },
  { rm: "550004", nome: "Diego Rocha", github: "diegorocha", papel: "Modelo de previsão de faltas" },
  { rm: "550005", nome: "Elisa Martins", github: "elisamartins", papel: "Pesquisa e conteúdo" },
];
