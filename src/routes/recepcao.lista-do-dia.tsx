import { createFileRoute } from "@tanstack/react-router";
import { ListaDoDia } from "@/pages/recepcao/ListaDoDia";

export const Route = createFileRoute("/recepcao/lista-do-dia")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Lista do dia | Acolhe+" },
      { name: "description", content: "Lista do dia no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Lista do dia | Acolhe+" },
      { property: "og:description", content: "Lista do dia no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: ListaDoDia,
});
