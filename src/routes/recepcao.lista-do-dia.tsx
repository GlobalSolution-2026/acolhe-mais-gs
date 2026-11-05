import { createFileRoute } from "@tanstack/react-router";
import { TelaEmConstrucao } from "@/pages/TelaEmConstrucao";

export const Route = createFileRoute("/recepcao/lista-do-dia")({
  head: () => ({
    meta: [
      { title: "Lista do dia | Acolhe+" },
      { name: "description", content: "Lista do dia no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Lista do dia | Acolhe+" },
      { property: "og:description", content: "Lista do dia no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: () => <TelaEmConstrucao titulo="Lista do dia" />,
});
