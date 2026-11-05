import { createFileRoute } from "@tanstack/react-router";
import { Consultas } from "@/pages/cidadao/Consultas";

export const Route = createFileRoute("/cidadao/consultas")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Consultas | Acolhe+" },
      { name: "description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Consultas | Acolhe+" },
      { property: "og:description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Consultas,
});
