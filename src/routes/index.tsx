import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Acolhe+ | Orientação e consultas no SUS" },
    { name: "description", content: "Acolhe+: orientação para buscar atendimento e agendar consultas no SUS." },
    { property: "og:title", content: "Acolhe+ | Orientação e consultas no SUS" },
    { property: "og:description", content: "Orientação para buscar atendimento e agendar consultas no SUS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/cidadao/inicio" });
  },
});
