import { createFileRoute } from "@tanstack/react-router";
import { Inicio } from "@/pages/cidadao/Inicio";

export const Route = createFileRoute("/inicio/")({
  head: () => ({
    meta: [
      { title: "Início | Acolhe+" },
      { name: "description", content: "Início no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Início | Acolhe+" },
      { property: "og:description", content: "Início no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Inicio,
});
