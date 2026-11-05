import { createFileRoute } from "@tanstack/react-router";
import { Faq } from "@/pages/Faq";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes | Acolhe+" },
      { name: "description", content: "Dúvidas comuns sobre o Acolhe+." },
      { property: "og:title", content: "Perguntas frequentes | Acolhe+" },
      { property: "og:description", content: "Dúvidas comuns sobre o Acolhe+." },
    ],
  }),
  component: Faq,
});
