import { createFileRoute } from "@tanstack/react-router";
import { Sucesso } from "@/pages/cidadao/Sucesso";

export const Route = createFileRoute("/cidadao/sucesso")({
  validateSearch: (s: Record<string, unknown>) => ({ consulta: Number(s["consulta"]) || 0 }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Consulta marcada | Acolhe+" },
      { name: "description", content: "Consulta marcada na UBS no aplicativo Acolhe+." },
      { property: "og:title", content: "Consulta marcada | Acolhe+" },
      { property: "og:description", content: "Consulta marcada na UBS no aplicativo Acolhe+." },
    ],
  }),
  component: function SucessoRoute() {
    const { consulta } = Route.useSearch();
    return <Sucesso cdConsulta={consulta} />;
  },
});
