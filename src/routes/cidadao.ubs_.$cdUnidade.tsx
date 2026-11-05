import { createFileRoute } from "@tanstack/react-router";
import { HorariosUbs } from "@/pages/cidadao/HorariosUbs";

export const Route = createFileRoute("/cidadao/ubs_/$cdUnidade")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
