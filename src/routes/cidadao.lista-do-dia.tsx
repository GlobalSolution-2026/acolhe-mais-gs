import { createFileRoute } from "@tanstack/react-router";
import { ListaDoDiaCidadao } from "@/pages/cidadao/ListaDoDiaCidadao";

export const Route = createFileRoute("/cidadao/lista-do-dia")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Lista do dia | Acolhe+" },
      { name: "description", content: "Posição na lista do dia da UBS no aplicativo Acolhe+." },
      { property: "og:title", content: "Lista do dia | Acolhe+" },
      { property: "og:description", content: "Posição na lista do dia da UBS no aplicativo Acolhe+." },
    ],
  }),
  component: ListaDoDiaCidadao,
});
