import { createFileRoute } from "@tanstack/react-router";
import { Agenda } from "@/pages/recepcao/Agenda";

export const Route = createFileRoute("/recepcao/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Acolhe+" },
      { name: "description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Agenda | Acolhe+" },
      { property: "og:description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Agenda,
});
