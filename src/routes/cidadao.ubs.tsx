import { createFileRoute } from "@tanstack/react-router";
import { Ubs } from "@/pages/cidadao/Ubs";

export const Route = createFileRoute("/cidadao/ubs")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "UBS próximas | Acolhe+" },
      { name: "description", content: "UBS próximas com horários livres no aplicativo Acolhe+." },
      { property: "og:title", content: "UBS próximas | Acolhe+" },
      { property: "og:description", content: "UBS próximas com horários livres no aplicativo Acolhe+." },
    ],
  }),
  component: Ubs,
});
