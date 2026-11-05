import { createFileRoute } from "@tanstack/react-router";
import { Cidadao } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao")({
  head: () => ({
    meta: [
      { title: "Simulador — Cidadão | Acolhe+" },
      { name: "description", content: "Aplicativo do cidadão no simulador do Acolhe+." },
      { property: "og:title", content: "Simulador — Cidadão | Acolhe+" },
      { property: "og:description", content: "Aplicativo do cidadão no simulador do Acolhe+." },
    ],
  }),
  component: Cidadao,
});
