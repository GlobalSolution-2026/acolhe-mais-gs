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

/** Destinos de volta depois de entrar ou criar conta (além do agendamento por horário/oferta). */
export type DestinoLogin = "" | "ficha" | "lista-do-dia";

export const lerDestinoLogin = (v: unknown): DestinoLogin => (v === "ficha" || v === "lista-do-dia" ? v : "");

/** Para onde voltar após o login: agendamento > ficha > lista do dia > perfil. */
export function destinoAposLogin(s: { horario: number; oferta: number; destino: DestinoLogin }):
  | { to: "/cidadao/agendar"; search: { horario: number; oferta: number } }
  | { to: "/cidadao/perfil/ficha" | "/cidadao/lista-do-dia" | "/cidadao/perfil" } {
  if (s.horario) return { to: "/cidadao/agendar", search: { horario: s.horario, oferta: s.oferta } };
  if (s.destino === "ficha") return { to: "/cidadao/perfil/ficha" };
  if (s.destino === "lista-do-dia") return { to: "/cidadao/lista-do-dia" };
  return { to: "/cidadao/perfil" };
}
