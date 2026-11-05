import { createFileRoute } from "@tanstack/react-router";
import { Pendentes } from "@/pages/recepcao/Pendentes";

export const Route = createFileRoute("/recepcao/pendentes")({
  head: () => ({
    meta: [
      { title: "Pendentes | Acolhe+" },
      { name: "description", content: "Pendentes no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Pendentes | Acolhe+" },
      { property: "og:description", content: "Pendentes no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Pendentes,
});
