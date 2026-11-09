export type DestinoPai =
  | "/cidadao/inicio" | "/cidadao/resultado" | "/cidadao/ubs"
  | "/cidadao/ubs/$cdUnidade" | "/cidadao/consultas" | "/cidadao/perfil";

/** Destinos fixos; o agendamento usa a UBS do horário selecionado. */
export function rotaPai(pathname: string, cdUnidade?: number): DestinoPai | null {
  const caminho = pathname.replace(/\/$/, "");
  switch (caminho) {
    case "/cidadao/orientacao":
    case "/cidadao/resultado": return "/cidadao/inicio";
    case "/cidadao/ubs": return "/cidadao/resultado";
    case "/cidadao/agendar": return cdUnidade ? "/cidadao/ubs/$cdUnidade" : "/cidadao/ubs";
    case "/cidadao/sucesso": return "/cidadao/consultas";
    case "/cidadao/lista-do-dia": return "/cidadao/ubs";
    case "/cidadao/perfil/editar":
    case "/cidadao/perfil/ficha":
    case "/cidadao/entrar":
    case "/cidadao/criar-conta": return "/cidadao/perfil";
    default: return /^\/cidadao\/ubs\/[^/]+$/.test(caminho) ? "/cidadao/ubs" : null;
  }
}
