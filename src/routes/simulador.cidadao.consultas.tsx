import { createFileRoute } from "@tanstack/react-router";
import { TelaCelular } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao/consultas")({
  head: () => ({ meta: [{ title: "Consultas — Simulador | Acolhe+" }, { name: "description", content: "Tela Consultas do aplicativo Acolhe+." }, { property: "og:title", content: "Consultas — Simulador | Acolhe+" }, { property: "og:description", content: "Tela Consultas do aplicativo Acolhe+." }] }),
  component: () => <TelaCelular titulo="Consultas" />,
});
