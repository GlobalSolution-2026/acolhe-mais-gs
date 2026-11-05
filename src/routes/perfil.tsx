import { createFileRoute } from "@tanstack/react-router";
import { Perfil } from "@/pages/cidadao/Perfil";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | Acolhe+" },
      { name: "description", content: "Perfil no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Perfil | Acolhe+" },
      { property: "og:description", content: "Perfil no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: Perfil,
});
