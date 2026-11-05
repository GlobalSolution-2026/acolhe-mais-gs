import { createFileRoute } from "@tanstack/react-router";
import { TelaEmConstrucao } from "@/pages/TelaEmConstrucao";

export const Route = createFileRoute("/inicio/horarios")({
  head: () => ({
    meta: [
      { title: "Horários nas UBS | Acolhe+" },
      { name: "description", content: "Horários nas UBS no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Horários nas UBS | Acolhe+" },
      { property: "og:description", content: "Horários nas UBS no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: () => <TelaEmConstrucao titulo="Horários nas UBS" />,
});
