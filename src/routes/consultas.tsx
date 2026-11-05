import { createFileRoute } from "@tanstack/react-router";
import { Consultas } from "@/pages/cidadao/Consultas";

export const Route = createFileRoute("/consultas")({
  head: () => ({
    meta: [
      { title: "Consultas | Acolhe+" },
      { name: "description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Consultas | Acolhe+" },
      { property: "og:description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Consultas,
});
