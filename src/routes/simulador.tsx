import { createFileRoute } from "@tanstack/react-router";
import { Simulador } from "@/pages/simulador/Simulador";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador | Acolhe+" },
      { name: "description", content: "Demonstração do aplicativo do cidadão e da recepção da UBS." },
      { property: "og:title", content: "Simulador | Acolhe+" },
      { property: "og:description", content: "Demonstração do aplicativo do cidadão e da recepção da UBS." },
    ],
  }),
  component: Simulador,
});
