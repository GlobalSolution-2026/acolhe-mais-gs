import { createFileRoute } from "@tanstack/react-router";
import { ListaDoDiaCidadao } from "@/pages/cidadao/ListaDoDiaCidadao";

export const Route = createFileRoute("/inicio/lista-do-dia")({
  head: () => ({
    meta: [
      { title: "Lista do dia | Acolhe+" },
      { name: "description", content: "Posição na lista do dia da UBS no aplicativo Acolhe+." },
      { property: "og:title", content: "Lista do dia | Acolhe+" },
      { property: "og:description", content: "Posição na lista do dia da UBS no aplicativo Acolhe+." },
    ],
  }),
  component: ListaDoDiaCidadao,
});
