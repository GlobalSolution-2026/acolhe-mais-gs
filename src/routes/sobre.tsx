import { createFileRoute } from "@tanstack/react-router";
import { Sobre } from "@/pages/Sobre";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre | Acolhe+" },
      { name: "description", content: "O problema das UPAs lotadas e das faltas nas consultas da UBS." },
      { property: "og:title", content: "Sobre | Acolhe+" },
      { property: "og:description", content: "O problema das UPAs lotadas e das faltas nas consultas da UBS." },
    ],
  }),
  component: Sobre,
});
