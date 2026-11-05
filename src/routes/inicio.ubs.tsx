import { createFileRoute } from "@tanstack/react-router";
import { Ubs } from "@/pages/cidadao/Ubs";

export const Route = createFileRoute("/inicio/ubs")({
  head: () => ({
    meta: [
      { title: "UBS próximas | Acolhe+" },
      { name: "description", content: "UBS próximas com horários livres no aplicativo Acolhe+." },
      { property: "og:title", content: "UBS próximas | Acolhe+" },
      { property: "og:description", content: "UBS próximas com horários livres no aplicativo Acolhe+." },
    ],
  }),
  component: Ubs,
});
