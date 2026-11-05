import { createFileRoute } from "@tanstack/react-router";
import { Indicadores } from "@/pages/recepcao/Indicadores";

export const Route = createFileRoute("/recepcao/indicadores")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Indicadores | Acolhe+" },
      { name: "description", content: "Indicadores no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Indicadores | Acolhe+" },
      { property: "og:description", content: "Indicadores no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Indicadores,
});
