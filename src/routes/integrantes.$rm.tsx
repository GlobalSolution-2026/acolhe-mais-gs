import { createFileRoute } from "@tanstack/react-router";
import { IntegranteDetalhe } from "@/pages/Integrantes";
import { integrantes } from "@/data/integrantes";

export const Route = createFileRoute("/integrantes/$rm")({
  head: ({ params }) => {
    const nome = integrantes.find((i) => i.rm === params.rm)?.nome ?? "Integrante";
    return {
      meta: [
        { title: `${nome} | Acolhe+` },
        { name: "description", content: `Perfil de ${nome} na equipe do Acolhe+.` },
        { property: "og:title", content: `${nome} | Acolhe+` },
        { property: "og:description", content: `Perfil de ${nome} na equipe do Acolhe+.` },
      ],
    };
  },
  component: Detalhe,
});

function Detalhe() {
  const { rm } = Route.useParams();
  return <IntegranteDetalhe rm={rm} />;
}
