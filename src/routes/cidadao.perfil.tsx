import { createFileRoute } from "@tanstack/react-router";
import { Perfil } from "@/pages/cidadao/Perfil";

export const Route = createFileRoute("/cidadao/perfil")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Perfil | Acolhe+" },
      { name: "description", content: "Perfil no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Perfil | Acolhe+" },
      { property: "og:description", content: "Perfil no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Perfil,
});
