import { createFileRoute } from "@tanstack/react-router";
import { Avisos } from "@/pages/cidadao/Avisos";

export const Route = createFileRoute("/cidadao/avisos")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Avisos | Acolhe+" },
      { name: "description", content: "Avisos no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Avisos | Acolhe+" },
      { property: "og:description", content: "Avisos no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Avisos,
});
