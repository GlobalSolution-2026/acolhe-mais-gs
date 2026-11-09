import { createFileRoute } from "@tanstack/react-router";
import { FichaSaudePagina } from "@/pages/cidadao/FichaSaude";

export const Route = createFileRoute("/cidadao/perfil_/ficha")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Ficha de saúde | Acolhe+" },
      { name: "description", content: "Ficha de saúde opcional do cidadão no aplicativo Acolhe+." },
      { property: "og:title", content: "Ficha de saúde | Acolhe+" },
      { property: "og:description", content: "Ficha de saúde opcional do cidadão no aplicativo Acolhe+." },
    ],
  }),
  component: FichaSaudePagina,
});
