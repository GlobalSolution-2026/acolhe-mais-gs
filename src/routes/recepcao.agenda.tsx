import { createFileRoute } from "@tanstack/react-router";
import { Agenda } from "@/pages/recepcao/Agenda";

export const Route = createFileRoute("/recepcao/agenda")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Agenda | Acolhe+" },
      { name: "description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Agenda | Acolhe+" },
      { property: "og:description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Agenda,
});
