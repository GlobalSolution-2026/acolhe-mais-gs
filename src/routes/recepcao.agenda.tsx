import { createFileRoute } from "@tanstack/react-router";
import { TelaEmConstrucao } from "@/pages/TelaEmConstrucao";

export const Route = createFileRoute("/recepcao/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | Acolhe+" },
      { name: "description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Agenda | Acolhe+" },
      { property: "og:description", content: "Agenda no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: () => <TelaEmConstrucao titulo="Agenda" />,
});
