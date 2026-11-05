import { createFileRoute } from "@tanstack/react-router";
import { Orientacao } from "@/pages/cidadao/Orientacao";

export const Route = createFileRoute("/inicio/orientacao")({
  head: () => ({
    meta: [
      { title: "Orientação | Acolhe+" },
      { name: "description", content: "Orientação no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Orientação | Acolhe+" },
      { property: "og:description", content: "Orientação no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Orientacao,
});
