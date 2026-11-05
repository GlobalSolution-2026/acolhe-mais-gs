import { createFileRoute } from "@tanstack/react-router";
import { TelaCelular } from "@/pages/simulador/Cidadao";

export const Route = createFileRoute("/simulador/cidadao/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Simulador | Acolhe+" }, { name: "description", content: "Tela Perfil do aplicativo Acolhe+." }, { property: "og:title", content: "Perfil — Simulador | Acolhe+" }, { property: "og:description", content: "Tela Perfil do aplicativo Acolhe+." }] }),
  component: () => <TelaCelular titulo="Perfil" />,
});
