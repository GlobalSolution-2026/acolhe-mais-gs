import { createFileRoute } from "@tanstack/react-router";
import { Solucao } from "@/pages/Solucao";

export const Route = createFileRoute("/solucao")({
  head: () => ({
    meta: [
      { title: "Solução | Acolhe+" },
      { name: "description", content: "Orientação, agendamento, confirmação e liberação de vagas no SUS." },
      { property: "og:title", content: "Solução | Acolhe+" },
      { property: "og:description", content: "Orientação, agendamento, confirmação e liberação de vagas no SUS." },
    ],
  }),
  component: Solucao,
});
