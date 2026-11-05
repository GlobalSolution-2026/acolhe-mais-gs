import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/pages/simulador/Simulador";

export const Route = createFileRoute("/simulador/recepcao")({
  head: () => ({
    meta: [
      { title: "Simulador — Recepção UBS | Acolhe+" },
      { name: "description", content: "Painel da recepção da UBS no simulador do Acolhe+." },
      { property: "og:title", content: "Simulador — Recepção UBS | Acolhe+" },
      { property: "og:description", content: "Painel da recepção da UBS no simulador do Acolhe+." },
    ],
  }),
  component: () => <EmConstrucao titulo="Recepção UBS" />,
});
