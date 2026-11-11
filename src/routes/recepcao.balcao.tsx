import { createFileRoute } from "@tanstack/react-router";
import { Balcao } from "@/pages/recepcao/Balcao";

export const Route = createFileRoute("/recepcao/balcao")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Balcão | Acolhe+" },
      { name: "description", content: "Balcão no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Balcão | Acolhe+" },
      { property: "og:description", content: "Balcão no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Balcao,
});
