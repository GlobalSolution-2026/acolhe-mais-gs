import { createFileRoute } from "@tanstack/react-router";
import { TelaCelular } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao/inicio")({
  head: () => ({ meta: [{ title: "Início — Simulador | Acolhe+" }, { name: "description", content: "Tela Início do aplicativo Acolhe+." }, { property: "og:title", content: "Início — Simulador | Acolhe+" }, { property: "og:description", content: "Tela Início do aplicativo Acolhe+." }] }),
  component: () => <TelaCelular titulo="Início" />,
});
