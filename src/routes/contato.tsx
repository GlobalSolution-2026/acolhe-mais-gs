import { createFileRoute } from "@tanstack/react-router";
import { Contato } from "@/pages/Contato";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato | Acolhe+" },
      { name: "description", content: "Fale com a equipe do Acolhe+." },
      { property: "og:title", content: "Contato | Acolhe+" },
      { property: "og:description", content: "Fale com a equipe do Acolhe+." },
    ],
  }),
  component: Contato,
});
