import { createFileRoute } from "@tanstack/react-router";
import { Agendar } from "@/pages/cidadao/Agendar";

export const Route = createFileRoute("/cidadao/agendar")({
  validateSearch: (s: Record<string, unknown>) => ({
    horario: Number(s["horario"]) || 0,
    oferta: Number(s["oferta"]) || 0,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Agendar consulta | Acolhe+" },
      { name: "description", content: "Agendar consulta na UBS no aplicativo Acolhe+." },
      { property: "og:title", content: "Agendar consulta | Acolhe+" },
      { property: "og:description", content: "Agendar consulta na UBS no aplicativo Acolhe+." },
    ],
  }),
  component: function AgendarRoute() {
    const { horario, oferta } = Route.useSearch();
    return <Agendar cdHorario={horario} cdOferta={oferta} />;
  },
});
