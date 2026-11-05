import { createFileRoute } from "@tanstack/react-router";
import { TelaCelular } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao/avisos")({
  head: () => ({ meta: [{ title: "Avisos — Simulador | Acolhe+" }, { name: "description", content: "Tela Avisos do aplicativo Acolhe+." }, { property: "og:title", content: "Avisos — Simulador | Acolhe+" }, { property: "og:description", content: "Tela Avisos do aplicativo Acolhe+." }] }),
  component: () => <TelaCelular titulo="Avisos" />,
});
