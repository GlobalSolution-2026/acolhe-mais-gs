import { createFileRoute } from "@tanstack/react-router";
import { Integrantes } from "@/pages/Integrantes";

export const Route = createFileRoute("/integrantes/")({
  head: () => ({
    meta: [
      { title: "Integrantes | Acolhe+" },
      { name: "description", content: "Conheça a equipe do Acolhe+." },
      { property: "og:title", content: "Integrantes | Acolhe+" },
      { property: "og:description", content: "Conheça a equipe do Acolhe+." },
    ],
  }),
  component: Integrantes,
});
