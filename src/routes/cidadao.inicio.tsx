import { createFileRoute } from "@tanstack/react-router";
import { Inicio } from "@/pages/cidadao/Inicio";

export const Route = createFileRoute("/cidadao/inicio")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Início | Acolhe+" },
      { name: "description", content: "Início no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Início | Acolhe+" },
      { property: "og:description", content: "Início no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Inicio,
});
