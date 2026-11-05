import { createFileRoute } from "@tanstack/react-router";
import { Sucesso } from "@/pages/cidadao/Sucesso";

export const Route = createFileRoute("/inicio/sucesso")({
  validateSearch: (s: Record<string, unknown>) => ({ consulta: Number(s["consulta"]) || 0 }),
  head: () => ({
    meta: [
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
