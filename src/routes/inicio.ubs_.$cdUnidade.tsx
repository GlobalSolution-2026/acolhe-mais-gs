import { createFileRoute } from "@tanstack/react-router";
import { HorariosUbs } from "@/pages/cidadao/HorariosUbs";

export const Route = createFileRoute("/inicio/ubs/$cdUnidade")({
  head: () => ({
    meta: [
      { title: "Horários da UBS | Acolhe+" },
      { name: "description", content: "Horários livres da UBS no aplicativo Acolhe+." },
      { property: "og:title", content: "Horários da UBS | Acolhe+" },
      { property: "og:description", content: "Horários livres da UBS no aplicativo Acolhe+." },
    ],
  }),
  component: function HorariosUbsRoute() {
    const { cdUnidade } = Route.useParams();
    return <HorariosUbs cdUnidade={Number(cdUnidade)} />;
  },
});
