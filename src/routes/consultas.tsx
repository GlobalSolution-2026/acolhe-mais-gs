import { createFileRoute } from "@tanstack/react-router";
import { TelaEmConstrucao } from "@/pages/TelaEmConstrucao";

export const Route = createFileRoute("/consultas")({
  head: () => ({
    meta: [
      { title: "Consultas | Acolhe+" },
      { name: "description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Consultas | Acolhe+" },
      { property: "og:description", content: "Consultas no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: () => <TelaEmConstrucao titulo="Consultas" />,
});
