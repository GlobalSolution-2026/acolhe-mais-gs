import { createFileRoute } from "@tanstack/react-router";
import { Avisos } from "@/pages/cidadao/Avisos";

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos | Acolhe+" },
      { name: "description", content: "Avisos no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Avisos | Acolhe+" },
      { property: "og:description", content: "Avisos no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Avisos,
});
