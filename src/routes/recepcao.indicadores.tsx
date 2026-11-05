import { createFileRoute } from "@tanstack/react-router";
import { TelaEmConstrucao } from "@/pages/TelaEmConstrucao";

export const Route = createFileRoute("/recepcao/indicadores")({
  head: () => ({
    meta: [
      { title: "Indicadores | Acolhe+" },
      { name: "description", content: "Indicadores no aplicativo Acolhe+, orientação e agendamento no SUS." },
      { property: "og:title", content: "Indicadores | Acolhe+" },
      { property: "og:description", content: "Indicadores no aplicativo Acolhe+, orientação e agendamento no SUS." },
    ],
  }),
  component: () => <TelaEmConstrucao titulo="Indicadores" />,
});
