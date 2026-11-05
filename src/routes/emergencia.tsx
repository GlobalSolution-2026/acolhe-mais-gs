import { createFileRoute } from "@tanstack/react-router";
import { Emergencia } from "@/pages/cidadao/Emergencia";

export const Route = createFileRoute("/emergencia")({
  head: () => ({
    meta: [
      { title: "Emergência | Acolhe+" },
      { name: "description", content: "Emergência no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Emergência | Acolhe+" },
      { property: "og:description", content: "Emergência no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Emergencia,
});
