import { createFileRoute } from "@tanstack/react-router";
import { Inicio } from "@/pages/Inicio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acolhe+ — onde buscar atendimento no SUS" },
      { name: "description", content: "Saiba se deve ir ao SAMU, pronto-socorro, UPA ou UBS e agende consulta na UBS." },
      { property: "og:title", content: "Acolhe+ — onde buscar atendimento no SUS" },
      { property: "og:description", content: "Saiba se deve ir ao SAMU, pronto-socorro, UPA ou UBS e agende consulta na UBS." },
    ],
  }),
  component: Inicio,
});
