import { createFileRoute } from "@tanstack/react-router";
import { Resultado } from "@/pages/cidadao/Resultado";

export const Route = createFileRoute("/cidadao/resultado")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Resultado da orientação | Acolhe+" },
      { name: "description", content: "Resultado da orientação no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Resultado da orientação | Acolhe+" },
      { property: "og:description", content: "Resultado da orientação no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Resultado,
});
