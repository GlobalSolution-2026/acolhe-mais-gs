import { createFileRoute } from "@tanstack/react-router";
import { StatusApi } from "@/pages/simulador/StatusApi";

export const Route = createFileRoute("/simulador/status-api")({
  head: () => ({
    meta: [
      { title: "Simulador — Status da API | Acolhe+" },
      { name: "description", content: "Situação da API do Acolhe+." },
      { property: "og:title", content: "Simulador — Status da API | Acolhe+" },
      { property: "og:description", content: "Situação da API do Acolhe+." },
    ],
  }),
  component: StatusApi,
});
