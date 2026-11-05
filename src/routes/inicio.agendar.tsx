import { createFileRoute } from "@tanstack/react-router";
import { Agendar } from "@/pages/cidadao/Agendar";

export const Route = createFileRoute("/inicio/agendar")({
  validateSearch: (s: Record<string, unknown>) => ({
    horario: Number(s["horario"]) || 0,
    oferta: Number(s["oferta"]) || 0,
  }),
  head: () => ({
    meta: [
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
