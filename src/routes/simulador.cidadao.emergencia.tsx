import { createFileRoute } from "@tanstack/react-router";
import { TelaCelular } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao/emergencia")({
  head: () => ({ meta: [{ title: "Emergência — Simulador | Acolhe+" }, { name: "description", content: "Tela Emergência do aplicativo Acolhe+." }, { property: "og:title", content: "Emergência — Simulador | Acolhe+" }, { property: "og:description", content: "Tela Emergência do aplicativo Acolhe+." }] }),
  component: () => <TelaCelular titulo="Emergência" />,
});
